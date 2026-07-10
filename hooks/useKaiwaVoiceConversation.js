"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { startElevenLabsSession } from "@/lib/apiPlaceholders";

const safeErrorMessage = "Voice Mode could not connect. Please try again or continue with another mode.";
export const demoAccessExpiredMessage = "Voice Mode needs a fresh demo code.";
let voiceSessionStartInFlight = false;

function getEventTimestamp(event) {
  const value = event?.event_id ?? event?.eventId ?? event?.timestamp ?? event?.time;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function nextLocalOrder() {
  return Date.now();
}

function normalizeMessage({ id, role, text, timestamp, receivedAt, isFinal }) {
  return {
    id,
    role,
    text,
    timestamp: timestamp ?? receivedAt,
    receivedAt,
    isFinal
  };
}

function toTranscriptBubble(item) {
  return {
    speaker: item.role === "agent" ? "ai" : "user",
    jp: item.text,
    romaji: "",
    en: ""
  };
}

function upsertTranscriptItem(items, nextItem) {
  const existingIndex = items.findIndex((item) => item.id === nextItem.id);
  if (existingIndex >= 0) {
    return items.map((item, index) => index === existingIndex ? {
      ...item,
      ...nextItem,
      text: !nextItem.isFinal && item.text && nextItem.text && nextItem.text !== item.text && nextItem.text.length < item.text.length
        ? `${item.text}${nextItem.text}`
        : nextItem.text,
      receivedAt: item.receivedAt ?? nextItem.receivedAt
    } : item);
  }

  if (nextItem.isFinal && items.some((item) => item.isFinal && item.role === nextItem.role && item.text === nextItem.text)) {
    return items;
  }

  return [...items, nextItem];
}

function sortTranscriptItems(items) {
  return [...items].sort((a, b) => {
    const aOrder = a.timestamp ?? a.receivedAt ?? 0;
    const bOrder = b.timestamp ?? b.receivedAt ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.receivedAt ?? 0) - (b.receivedAt ?? 0);
  });
}

function cleanFinalTranscriptItems(items) {
  const seenFinal = new Set();
  return sortTranscriptItems(items)
    .filter((item) => {
      if (!item.isFinal) return true;
      const key = `${item.role}:${item.text}`;
      if (seenFinal.has(key)) return false;
      seenFinal.add(key);
      return true;
    });
}

function finalizedTranscriptItems(items) {
  return cleanFinalTranscriptItems(items).filter((item) => item.isFinal);
}

export function useKaiwaVoiceConversation() {
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [localStatus, setLocalStatus] = useState("Ready");
  const [transcriptEvents, setTranscriptEvents] = useState([]);
  const startingRef = useRef(false);
  const permissionStreamRef = useRef(null);
  const agentPartRef = useRef(null);
  const endSessionRef = useRef(null);

  const handleMessage = useCallback((message) => {
    const role = message.role === "agent" || message.source === "ai" ? "agent" : "user";
    const eventTimestamp = getEventTimestamp(message);
    const receivedAt = nextLocalOrder();
    const id = eventTimestamp !== null ? `${role}-${eventTimestamp}` : `${role}-${receivedAt}-${message.message}`;

    setTranscriptEvents((items) => {
      const withoutStalePartials = role === "agent"
        ? items.filter((item) => item.isFinal || item.role !== "agent" || item.id === id)
        : items;

      if (role === "agent" && agentPartRef.current === id) {
        agentPartRef.current = null;
      }

      return upsertTranscriptItem(withoutStalePartials, normalizeMessage({
        id,
        role,
        text: message.message,
        timestamp: eventTimestamp,
        receivedAt,
        isFinal: true
      }));
    });
  }, []);

  const conversation = useConversation({
    onConnect: ({ conversationId: connectedId }) => {
      setConversationId(connectedId);
      setLocalStatus("Connected");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
      setError("");
    },
    onDisconnect: () => {
      setLocalStatus((current) => current === "Ended" ? current : "Ended");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
    },
    onError: () => {
      setError(safeErrorMessage);
      setLocalStatus("Connection failed");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
    },
    onMessage: handleMessage,
    onAgentChatResponsePart: (part) => {
      const text = part?.text || part?.text_response || part?.textResponse || "";
      const eventTimestamp = getEventTimestamp(part);
      if (!text || eventTimestamp === null || part?.type === "stop") return;

      const id = `agent-${eventTimestamp}`;
      agentPartRef.current = id;
      setTranscriptEvents((items) => upsertTranscriptItem(items, normalizeMessage({
        id,
        role: "agent",
        text,
        timestamp: eventTimestamp,
        receivedAt: nextLocalOrder(),
        isFinal: false
      })));
    },
    onAgentResponseCorrection: (correction) => {
      const correctedText = correction?.corrected_agent_response || correction?.agent_response || "";
      const eventId = correction?.event_id;
      if (!correctedText || eventId === undefined || eventId === null) return;

      setTranscriptEvents((items) => upsertTranscriptItem(items, normalizeMessage({
        id: `agent-${eventId}`,
        role: "agent",
        text: correctedText,
        timestamp: getEventTimestamp(correction),
        receivedAt: nextLocalOrder(),
        isFinal: true
      })));
    }
  });

  useEffect(() => {
    endSessionRef.current = conversation.endSession;
  }, [conversation.endSession]);

  const releasePermissionStream = useCallback(() => {
    permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
    permissionStreamRef.current = null;
  }, []);

  const endVoiceSession = useCallback(() => {
    try {
      conversation.endSession();
    } catch {
      // The SDK may already be disconnected; cleanup below is still safe.
    }
    releasePermissionStream();
    startingRef.current = false;
    voiceSessionStartInFlight = false;
    setLocalStatus("Ended");
  }, [conversation, releasePermissionStream]);

  const startVoiceSession = useCallback(async (sessionConfig) => {
    const isBusy = startingRef.current ||
      voiceSessionStartInFlight ||
      localStatus === "Waiting for microphone" ||
      localStatus === "Connecting" ||
      conversation.status === "connecting" ||
      conversation.status === "connected";

    if (isBusy) {
      return;
    }

    startingRef.current = true;
    voiceSessionStartInFlight = true;
    setError("");
    setLocalStatus("Waiting for microphone");

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("microphone-unavailable");
      }

      permissionStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      releasePermissionStream();
      setLocalStatus("Connecting");

      const session = await startElevenLabsSession(sessionConfig);
      const sessionOptions = {
        dynamicVariables: session.dynamicVariables
      };

      if (session.conversationToken) {
        sessionOptions.conversationToken = session.conversationToken;
        sessionOptions.connectionType = "webrtc";
      } else if (session.signedUrl) {
        sessionOptions.signedUrl = session.signedUrl;
        sessionOptions.connectionType = "websocket";
      } else {
        throw new Error("missing-temporary-credential");
      }

      conversation.startSession(sessionOptions);
    } catch (startError) {
      releasePermissionStream();
      startingRef.current = false;
      voiceSessionStartInFlight = false;
      setError(startError?.name === "NotAllowedError"
        ? "Microphone access is needed for Voice Mode."
        : startError?.code === "INVALID_DEMO_ACCESS" || startError?.message === "Voice Mode requires demo access."
          ? demoAccessExpiredMessage
          : safeErrorMessage);
      setLocalStatus("Connection failed");
    }
  }, [conversation, localStatus, releasePermissionStream]);

  const muteMicrophone = useCallback(() => {
    conversation.setMuted(true);
    setLocalStatus("Muted");
  }, [conversation]);

  const unmuteMicrophone = useCallback(() => {
    conversation.setMuted(false);
    setLocalStatus(conversation.isSpeaking ? "Agent speaking" : "User speaking");
  }, [conversation]);

  const setVolume = useCallback((volume) => {
    conversation.setVolume({ volume });
  }, [conversation]);

  const sendContextualUpdate = useCallback((text) => {
    if (conversation.status !== "connected") return false;
    conversation.sendContextualUpdate(text);
    return true;
  }, [conversation]);

  useEffect(() => {
    if (conversation.status === "connecting") setLocalStatus("Connecting");
    if (conversation.status === "connected" && !conversation.isMuted) {
      setLocalStatus(conversation.isSpeaking ? "Agent speaking" : "User speaking");
    }
    if (conversation.status === "disconnecting") setLocalStatus("Ended");
    if (conversation.status === "disconnected" && localStatus !== "Connection failed") {
      startingRef.current = false;
    }
  }, [conversation.isMuted, conversation.isSpeaking, conversation.status, localStatus]);

  useEffect(() => () => {
    try {
      endSessionRef.current?.();
    } catch {
      // Best-effort unmount cleanup.
    }
    releasePermissionStream();
  }, [releasePermissionStream]);

  const sortedTranscriptEvents = useMemo(() => cleanFinalTranscriptItems(transcriptEvents), [transcriptEvents]);
  const finalTranscriptEvents = useMemo(() => finalizedTranscriptItems(transcriptEvents), [transcriptEvents]);
  const transcript = useMemo(() => sortedTranscriptEvents.map(toTranscriptBubble), [sortedTranscriptEvents]);
  const finalTranscript = useMemo(() => finalTranscriptEvents.map(toTranscriptBubble), [finalTranscriptEvents]);

  return {
    status: localStatus,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    isListening: conversation.isListening,
    conversationId,
    error,
    transcriptEvents: sortedTranscriptEvents,
    transcript,
    finalTranscriptEvents,
    finalTranscript,
    startVoiceSession,
    endVoiceSession,
    muteMicrophone,
    unmuteMicrophone,
    setVolume,
    sendContextualUpdate
  };
}
