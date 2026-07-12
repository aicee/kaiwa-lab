"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { startElevenLabsSession } from "@/lib/apiPlaceholders";
import {
  getFinalTranscript,
  getLiveTranscript,
  normalizeAgentResponsePart,
  normalizeTranscriptMessage,
  sanitizeTranscriptForFeedback,
  transcriptTurnToBubble,
  upsertTranscriptTurn
} from "@/lib/transcript";

const safeErrorMessage = "Voice practice could not connect. Please try again or view the demo flow.";
export const demoAccessExpiredMessage = "Voice practice needs a fresh demo code.";
let voiceSessionStartInFlight = false;

export function useKaiwaVoiceConversation() {
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [localStatus, setLocalStatus] = useState("Ready");
  const [transcriptEvents, setTranscriptEvents] = useState([]);
  const startingRef = useRef(false);
  const permissionStreamRef = useRef(null);
  const endSessionRef = useRef(null);
  const transcriptEventsRef = useRef([]);
  const localOrderRef = useRef(0);
  const manuallyEndingRef = useRef(false);
  const connectedOnceRef = useRef(false);

  const nextLocalOrder = useCallback(() => {
    localOrderRef.current += 1;
    return localOrderRef.current;
  }, []);

  const updateTranscriptEvents = useCallback((updater) => {
    setTranscriptEvents((current) => {
      const next = updater(current);
      transcriptEventsRef.current = next;
      return next;
    });
  }, []);

  const handleMessage = useCallback((message) => {
    const normalized = normalizeTranscriptMessage(message, {
      order: nextLocalOrder(),
      isFinal: true
    });
    updateTranscriptEvents((items) => upsertTranscriptTurn(items, normalized));
  }, [nextLocalOrder, updateTranscriptEvents]);

  const conversation = useConversation({
    onConnect: ({ conversationId: connectedId }) => {
      setConversationId(connectedId);
      setLocalStatus("Connected");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
      manuallyEndingRef.current = false;
      connectedOnceRef.current = true;
      setError("");
    },
    onDisconnect: () => {
      const hasFinalTranscript = getFinalTranscript(transcriptEventsRef.current).length > 0;
      if (connectedOnceRef.current && !manuallyEndingRef.current && hasFinalTranscript) {
        setError("The voice session was disconnected. Your available transcript has been kept.");
      }
      setLocalStatus((current) => current === "Ended" ? current : "Ended");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
      manuallyEndingRef.current = false;
    },
    onError: () => {
      setError(safeErrorMessage);
      setLocalStatus("Connection failed");
      startingRef.current = false;
      voiceSessionStartInFlight = false;
    },
    onMessage: handleMessage,
    onAgentChatResponsePart: (part) => {
      const normalized = normalizeAgentResponsePart(part, {
        order: nextLocalOrder()
      });
      updateTranscriptEvents((items) => upsertTranscriptTurn(items, normalized));
    },
    onAgentResponseCorrection: (correction) => {
      const normalized = normalizeTranscriptMessage(correction, {
        role: "agent",
        text: correction?.corrected_agent_response || correction?.agent_response || "",
        order: nextLocalOrder(),
        isFinal: true
      });
      updateTranscriptEvents((items) => upsertTranscriptTurn(items, normalized));
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
    manuallyEndingRef.current = true;
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
    manuallyEndingRef.current = false;
    connectedOnceRef.current = false;
    transcriptEventsRef.current = [];
    setTranscriptEvents([]);
    setConversationId(null);
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
        ? "Microphone access is needed for voice practice."
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

  const getFinalTranscriptSnapshot = useCallback(() => {
    return sanitizeTranscriptForFeedback(transcriptEventsRef.current);
  }, []);

  const liveTranscriptEvents = useMemo(() => getLiveTranscript(transcriptEvents), [transcriptEvents]);
  const finalTranscriptEvents = useMemo(() => getFinalTranscript(transcriptEvents), [transcriptEvents]);
  const transcript = useMemo(() => liveTranscriptEvents.map(transcriptTurnToBubble), [liveTranscriptEvents]);
  const finalTranscript = useMemo(() => finalTranscriptEvents.map(transcriptTurnToBubble), [finalTranscriptEvents]);

  return {
    status: localStatus,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    isListening: conversation.isListening,
    conversationId,
    error,
    transcriptEvents: liveTranscriptEvents,
    transcript,
    finalTranscriptEvents,
    finalTranscript,
    getFinalTranscript: getFinalTranscriptSnapshot,
    startVoiceSession,
    endVoiceSession,
    muteMicrophone,
    unmuteMicrophone,
    setVolume,
    sendContextualUpdate
  };
}
