"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { startElevenLabsSession } from "@/lib/apiPlaceholders";

const safeErrorMessage = "Voice Mode could not connect. Please try again or continue with another mode.";

function normalizeMessage({ id, role, text, isFinal }) {
  return {
    id,
    role,
    text,
    timestamp: Date.now(),
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
    return items.map((item, index) => index === existingIndex ? { ...item, ...nextItem } : item);
  }

  if (nextItem.isFinal && items.some((item) => item.isFinal && item.role === nextItem.role && item.text === nextItem.text)) {
    return items;
  }

  return [...items, nextItem];
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
    const id = message.event_id ? `${role}-${message.event_id}` : `${role}-${Date.now()}-${message.message}`;

    setTranscriptEvents((items) => {
      const withoutPartial = agentPartRef.current && role === "agent"
        ? items.filter((item) => item.id !== agentPartRef.current)
        : items;
      agentPartRef.current = role === "agent" ? null : agentPartRef.current;

      return upsertTranscriptItem(withoutPartial, normalizeMessage({
        id,
        role,
        text: message.message,
        isFinal: true
      }));
    });
  }, []);

  const conversation = useConversation({
    onConnect: ({ conversationId: connectedId }) => {
      setConversationId(connectedId);
      setLocalStatus("Connected");
      startingRef.current = false;
      setError("");
    },
    onDisconnect: () => {
      setLocalStatus((current) => current === "Ended" ? current : "Ended");
      startingRef.current = false;
    },
    onError: () => {
      setError(safeErrorMessage);
      setLocalStatus("Connection failed");
      startingRef.current = false;
    },
    onMessage: handleMessage,
    onAgentChatResponsePart: (part) => {
      const text = part?.text || part?.text_response || part?.textResponse || "";
      if (!text) return;

      const id = agentPartRef.current || `agent-part-${Date.now()}`;
      agentPartRef.current = id;
      setTranscriptEvents((items) => upsertTranscriptItem(items, normalizeMessage({
        id,
        role: "agent",
        text,
        isFinal: false
      })));
    },
    onAgentResponseCorrection: (correction) => {
      const correctedText = correction?.corrected_agent_response || correction?.agent_response || "";
      const eventId = correction?.event_id;
      if (!correctedText || !eventId) return;

      setTranscriptEvents((items) => upsertTranscriptItem(items, normalizeMessage({
        id: `agent-${eventId}`,
        role: "agent",
        text: correctedText,
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
    setLocalStatus("Ended");
  }, [conversation, releasePermissionStream]);

  const startVoiceSession = useCallback(async (sessionConfig) => {
    if (startingRef.current || conversation.status === "connecting" || conversation.status === "connected") {
      return;
    }

    startingRef.current = true;
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
      setError(startError?.name === "NotAllowedError"
        ? "Microphone access is needed for Voice Mode."
        : safeErrorMessage);
      setLocalStatus("Connection failed");
    }
  }, [conversation, releasePermissionStream]);

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

  const transcript = useMemo(() => transcriptEvents.map(toTranscriptBubble), [transcriptEvents]);

  return {
    status: localStatus,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    isListening: conversation.isListening,
    conversationId,
    error,
    transcriptEvents,
    transcript,
    startVoiceSession,
    endVoiceSession,
    muteMicrophone,
    unmuteMicrophone,
    setVolume,
    sendContextualUpdate
  };
}
