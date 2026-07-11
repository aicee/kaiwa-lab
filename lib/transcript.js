const VALID_ROLES = new Set(["agent", "user"]);

function getText(value) {
  return typeof value === "string" ? value : "";
}

function getEventId(payload) {
  const value = payload?.event_id ?? payload?.eventId;
  return value === undefined || value === null || value === "" ? null : String(value);
}

function getRole(payload) {
  if (payload?.role === "agent" || payload?.source === "ai") return "agent";
  if (payload?.role === "user" || payload?.source === "user") return "user";
  return null;
}

function getTimestamp(payload, fallback) {
  const value = payload?.event_id ?? payload?.eventId ?? payload?.timestamp ?? payload?.time;
  return value === undefined || value === null ? fallback : value;
}

function makeFallbackId({ role, text, order }) {
  return `${role}:local:${order}:${text.length}`;
}

function isDialogueText(text) {
  return typeof text === "string" && text.trim().length > 0;
}

function stripInternalFields(turn) {
  return {
    id: turn.id,
    role: turn.role,
    text: turn.text,
    timestamp: turn.timestamp,
    isFinal: turn.isFinal
  };
}

export function normalizeTranscriptMessage(payload, options = {}) {
  const role = options.role || getRole(payload);
  const text = getText(
    options.text ??
    payload?.message ??
    payload?.user_transcript ??
    payload?.agent_response ??
    payload?.corrected_agent_response ??
    payload?.text
  );

  if (!VALID_ROLES.has(role) || !isDialogueText(text)) {
    return null;
  }

  const eventId = options.eventId ?? getEventId(payload);
  const order = options.order ?? Date.now();
  const id = options.id || (eventId !== null ? `${role}:${eventId}` : makeFallbackId({ role, text, order }));

  return {
    id,
    role,
    text,
    timestamp: getTimestamp(payload, options.timestamp ?? order),
    isFinal: options.isFinal !== false,
    _order: order,
    _eventId: eventId
  };
}

export function normalizeAgentResponsePart(part, options = {}) {
  const type = part?.type;
  const eventId = options.eventId ?? getEventId(part);
  const order = options.order ?? Date.now();

  if (type === "stop" || eventId === null) {
    return null;
  }

  const text = getText(part?.text ?? part?.text_response ?? part?.textResponse);
  if (!isDialogueText(text)) {
    return null;
  }

  return {
    id: `agent:${eventId}`,
    role: "agent",
    text,
    timestamp: getTimestamp(part, options.timestamp ?? order),
    isFinal: false,
    _order: order,
    _eventId: eventId,
    _partType: type || "delta"
  };
}

export function upsertTranscriptTurn(turns, nextTurn) {
  if (!nextTurn || !isDialogueText(nextTurn.text)) {
    return turns;
  }

  const existingIndex = turns.findIndex((turn) => turn.id === nextTurn.id);
  if (existingIndex >= 0) {
    return turns.map((turn, index) => {
      if (index !== existingIndex) return turn;

      const isDelta = !nextTurn.isFinal && nextTurn._partType === "delta";
      const text = isDelta ? `${turn.text}${nextTurn.text}` : nextTurn.text;

      return {
        ...turn,
        ...nextTurn,
        text,
        _order: turn._order ?? nextTurn._order
      };
    });
  }

  return [...turns, nextTurn];
}

export function getLiveTranscript(turns) {
  return turns
    .filter((turn) => isDialogueText(turn.text))
    .sort((a, b) => (a._order ?? 0) - (b._order ?? 0))
    .map(stripInternalFields);
}

export function getFinalTranscript(turns) {
  return getLiveTranscript(turns).filter((turn) => turn.isFinal);
}

export function sanitizeTranscriptForFeedback(turns) {
  return getFinalTranscript(turns);
}

export function transcriptTurnToBubble(turn) {
  return {
    speaker: turn.role === "agent" ? "ai" : "user",
    jp: turn.text,
    romaji: "",
    en: ""
  };
}
