"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { AudioLines, Check, ChevronRight, CircleHelp, Languages, Lightbulb, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { mockTranscript } from "@/data/mockTranscript";
import { demoAccessExpiredMessage, useKaiwaVoiceConversation } from "@/hooks/useKaiwaVoiceConversation";
import { buildElevenLabsDynamicVariables } from "@/lib/scenarioPrompts";
import { getSupportLevelLabel } from "@/lib/practiceSettings";
import TranscriptBubble from "./TranscriptBubble";

const reviewMessages = [
  { at: 0, title: "Reviewing your conversation…", body: "Checking what you said and how the interaction went." },
  { at: 5, title: "Finding the moments that helped you communicate…", body: "Looking for clear strengths and useful corrections." },
  { at: 12, title: "Preparing your practice notes…", body: "Choosing the most useful phrases for next time." },
  { at: 20, title: "Still reviewing your conversation…", body: "A detailed voice session can take a little longer to analyze." }
];

const normalizeGoalText = (text) => (text || "").toLowerCase().replace(/[。、,.!?！？\s]/g, "");

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function userCompletedGoal({ scenarioId, goal, usefulPhrase, userText }) {
  const text = normalizeGoalText(userText);
  const goalText = normalizeGoalText(goal);
  const phrase = normalizeGoalText(usefulPhrase);

  if (!text) return false;
  if (phrase && phrase.length >= 5 && text.includes(phrase)) return true;

  if (scenarioId === "ramen") {
    if (goalText.includes("numberofpeople")) return includesAny(text, ["一人", "ひとり", "1人", "二人", "ふたり", "2人", "三人", "3人", "四人", "4人"]);
    if (goalText.includes("recommendation")) return text.includes("おすすめ") && includesAny(text, ["何", "なに", "なん", "ありますか", "ですか", "は"]);
    if (goalText.includes("orderfood")) return includesAny(text, ["ラーメン", "餃子", "チャーハン", "つけ麺"]) && includesAny(text, ["ください", "お願いします", "一つ", "ひとつ"]);
    if (goalText.includes("wateroranotherrequest")) return includesAny(text, ["お水", "水", "メニュー", "トイレ"]) && includesAny(text, ["ください", "お願いします", "どこ", "ありますか"]);
    if (goalText.includes("pay")) return includesAny(text, ["会計", "お会計", "払います", "カード", "現金"]) && includesAny(text, ["お願いします", "ください", "払います"]);
  }

  return phrase && phrase.length >= 4 && text.includes(phrase);
}

function LiveSupportPanel({ support, onClear }) {
  if (!support) return null;

  return <div className={`context-support-card ${support.type}`}>
    <button type="button" className="support-clear" onClick={onClear} aria-label="Clear live help">×</button>
    <small>{support.title}</small>
    {support.message && <p>{support.message}</p>}
    {(support.japanese || support.romaji || support.english) && <div className="support-example">
      {support.japanese && <b>{support.japanese}</b>}
      {support.romaji && <i>{support.romaji}</i>}
      {support.english && <span>{support.english}</span>}
    </div>}
    {Array.isArray(support.options) && support.options.length > 0 && <div className="support-options">
      {support.options.map((option, index) => <div className="support-example" key={`${option.japanese}-${index}`}>
        <b>{option.japanese}</b>
        {option.romaji && <i>{option.romaji}</i>}
        {option.english && <span>{option.english}</span>}
      </div>)}
    </div>}
  </div>;
}

export default function ConversationRoom({ scenario, settings, onEnd, onVoiceAccessExpired }) {
  return <ConversationProvider><ConversationRoomContent scenario={scenario} settings={settings} onEnd={onEnd} onVoiceAccessExpired={onVoiceAccessExpired} /></ConversationProvider>;
}

function ConversationRoomContent({ scenario, settings, onEnd, onVoiceAccessExpired }) {
  const [activeMode, setActiveMode] = useState(settings.mode);
  const isDemoMode = activeMode === "Demo Mode";
  const isVoiceMode = activeMode === "Voice Mode";
  const voice = useKaiwaVoiceConversation();
  const voiceStartedRef = useRef(false);
  const endingRef = useRef(false);
  const scrollAreaRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const userNearBottomRef = useRef(true);
  const scenarioTranscript = useMemo(() => [
    {
      speaker: "ai",
      jp: scenario.opening,
      romaji: "",
      en: ""
    },
    ...mockTranscript.slice(1)
  ], [scenario.opening]);
  const [count, setCount] = useState(isDemoMode ? 1 : 0);
  const [romaji, setRomaji] = useState(settings.romaji);
  const [translation, setTranslation] = useState(settings.translation);
  const [conversationSupport, setConversationSupport] = useState(null);
  const [supportLoading, setSupportLoading] = useState(null);
  const [supportError, setSupportError] = useState("");
  const [seconds, setSeconds] = useState(isVoiceMode ? 0 : 42);
  const [ending, setEnding] = useState(false);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [completedGoalIndexes, setCompletedGoalIndexes] = useState(() => new Set());
  const [reviewElapsed, setReviewElapsed] = useState(0);
  const sessionPayload = useMemo(() => buildElevenLabsDynamicVariables({
    scenario,
    level: settings.level,
    politenessMode: scenario.politenessMode || settings.politeness,
    supportLevel: settings.supportLevelLabel || getSupportLevelLabel(settings.supportLevel),
    showRomaji: settings.romaji,
    showTranslation: settings.translation,
    practiceMode: "Voice Mode"
  }), [scenario, settings.level, settings.politeness, settings.romaji, settings.translation, settings.supportLevel, settings.supportLevelLabel]);

  useEffect(() => {
    setCompletedGoalIndexes(new Set());
    endingRef.current = false;
    setEnding(false);
    setConversationSupport(null);
    setSupportLoading(null);
    setSupportError("");
    setShowJumpLatest(false);

    if (isVoiceMode) {
      setCount(0);
      setSeconds(0);
      voiceStartedRef.current = false;
    }

    if (process.env.NODE_ENV === "development" && isVoiceMode) {
      console.info("Kaiwa Voice diagnostics", {
        stage: "GOAL_PROGRESS_RESET",
        scenarioId: scenario.id,
        goalCount: scenario.goals.length
      });
    }
  }, [isVoiceMode, scenario.id, scenario.goals.length]);

  useEffect(() => {
    if (!isVoiceMode || voiceStartedRef.current) return;
    voiceStartedRef.current = true;
    voice.startVoiceSession(sessionPayload);
  }, [isVoiceMode, sessionPayload, voice]);

  useEffect(() => {
    if (isVoiceMode) return;
    setCount(1);
    setSeconds(42);
    voiceStartedRef.current = false;
  }, [isVoiceMode, scenarioTranscript]);

  useEffect(() => {
    const shouldRunTimer = !ending && (!isVoiceMode || voice.isConnected);
    if (!shouldRunTimer) return undefined;

    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [ending, isVoiceMode, voice.isConnected]);

  useEffect(() => {
    if (!isVoiceMode || !voice.isConnected || seconds < 300 || ending) return;
    endSession();
  }, [ending, isVoiceMode, seconds, voice.isConnected]);

  useEffect(() => {
    if (!isVoiceMode || ending || !voiceStartedRef.current || voice.status !== "Ended" || voice.finalTranscriptEvents.length === 0) return;
    endSession();
  }, [ending, isVoiceMode, voice.finalTranscriptEvents.length, voice.status]);

  useEffect(() => {
    if (!isVoiceMode || voice.error !== demoAccessExpiredMessage) return;
    onVoiceAccessExpired?.();
  }, [isVoiceMode, onVoiceAccessExpired, voice.error]);

  useEffect(() => {
    if (!isVoiceMode) return;

    const userText = voice.finalTranscriptEvents
      .filter((turn) => turn.role === "user" && turn.isFinal !== false)
      .map((turn) => turn.text)
      .join(" ");
    const nextCompleted = new Set();

    scenario.goals.forEach((goal, index) => {
      if (userCompletedGoal({
        scenarioId: scenario.id,
        goal,
        usefulPhrase: scenario.usefulPhrases[index],
        userText
      })) {
        nextCompleted.add(index);
      }
    });

    setCompletedGoalIndexes((current) => {
      const sameValues = current.size === nextCompleted.size && [...current].every((index) => nextCompleted.has(index));
      if (sameValues) return current;

      if (process.env.NODE_ENV === "development") {
        console.info("Kaiwa Voice diagnostics", {
          stage: "GOAL_PROGRESS_UPDATED",
          completedGoalCount: nextCompleted.size,
          totalGoalCount: scenario.goals.length
        });
      }

      return nextCompleted;
    });
  }, [isVoiceMode, scenario.goals, scenario.id, scenario.usefulPhrases, voice.finalTranscriptEvents]);

  useEffect(() => {
    if (!ending) {
      setReviewElapsed(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      setReviewElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [ending]);

  const transcript = isVoiceMode ? voice.transcript : scenarioTranscript.slice(0, count);
  const finalizedMessageCount = isVoiceMode ? voice.finalTranscriptEvents.length : transcript.length;
  // Demo flow goal progress is intentionally mock-only. Real goal completion
  // will be generated after the session from the completed transcript via OpenAI feedback.
  const done = isVoiceMode ? completedGoalIndexes.size : Math.min(3, Math.ceil(count / 2));
  const currentGoalIndex = scenario.goals.findIndex((_, index) => !completedGoalIndexes.has(index));
  const reviewMessage = [...reviewMessages].reverse().find((message) => reviewElapsed >= message.at) || reviewMessages[0];
  const next = () => { setCount(c => Math.min(scenarioTranscript.length, c + 1)); setConversationSupport(null); setSupportError(""); };
  const lastAi = [...transcript].reverse().find(m => m.speaker === "ai");
  const latestAgentTurn = useMemo(() => {
    if (isVoiceMode) {
      return [...voice.finalTranscriptEvents].reverse().find((turn) => turn.role === "agent" && turn.isFinal !== false && turn.text?.trim()) || null;
    }

    for (let index = transcript.length - 1; index >= 0; index -= 1) {
      const item = transcript[index];
      if (item?.speaker === "ai" && item.jp?.trim()) {
        return {
          id: `demo-agent:${index}:${item.jp.length}`,
          role: "agent",
          text: item.jp,
          isFinal: true
        };
      }
    }

    return null;
  }, [isVoiceMode, transcript, voice.finalTranscriptEvents]);
  const roomStatus = isVoiceMode ? voice.status : "Ready";
  const updateNearBottom = () => {
    const element = scrollAreaRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const isNearBottom = distanceFromBottom < 140;
    userNearBottomRef.current = isNearBottom;
    if (isNearBottom) setShowJumpLatest(false);
  };
  const scrollToLatest = () => {
    transcriptEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    userNearBottomRef.current = true;
    setShowJumpLatest(false);
  };
  useEffect(() => {
    if (!isVoiceMode) {
      setShowJumpLatest(false);
      return;
    }
    if (userNearBottomRef.current) {
      window.requestAnimationFrame(() => transcriptEndRef.current?.scrollIntoView({ block: "end" }));
      return;
    }
    setShowJumpLatest(true);
  }, [finalizedMessageCount, isVoiceMode]);

  useEffect(() => {
    if (!conversationSupport?.relatedAgentTurnId || !latestAgentTurn?.id) return;
    if (conversationSupport.relatedAgentTurnId !== latestAgentTurn.id) {
      setConversationSupport(null);
      setSupportError("");
      setSupportLoading(null);
    }
  }, [conversationSupport?.relatedAgentTurnId, latestAgentTurn?.id]);

  const endSession = async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    const endedAt = new Date().toISOString();
    const finalizedVoiceTranscript = isVoiceMode ? voice.getFinalTranscript() : null;
    const supportLabel = settings.supportLevelLabel || getSupportLevelLabel(settings.supportLevel);
    const sessionResult = {
      scenario: {
        id: scenario.id,
        name: scenario.name,
        role: scenario.role,
        description: scenario.description,
        goals: scenario.goals,
        usefulPhrases: scenario.usefulPhrases
      },
      level: settings.level,
      supportLevel: supportLabel,
      supportLevelValue: settings.supportLevel,
      supportLevelLabel: supportLabel,
      politenessMode: scenario.politenessMode || settings.politeness,
      politeness: scenario.politenessMode || settings.politeness,
      goals: scenario.goals.map((goal, index) => ({ goal, completed: isVoiceMode ? completedGoalIndexes.has(index) : index < done })),
      transcript: isVoiceMode ? finalizedVoiceTranscript : transcript,
      voiceTranscriptEvents: isVoiceMode ? finalizedVoiceTranscript : voice.transcriptEvents,
      conversationId: isVoiceMode ? voice.conversationId : null,
      duration: seconds,
      durationSeconds: seconds,
      endedAt,
      practiceMode: activeMode,
      mode: activeMode
    };

    if (process.env.NODE_ENV === "development" && isVoiceMode) {
      console.info("Kaiwa Voice session finalized", {
        conversationId: sessionResult.conversationId,
        scenario: sessionResult.scenario?.name,
        level: sessionResult.level,
        supportLevel: sessionResult.supportLevel,
        politenessMode: sessionResult.politenessMode,
        practiceMode: sessionResult.practiceMode,
        duration: sessionResult.duration,
        endedAt: sessionResult.endedAt,
        transcriptLength: sessionResult.transcript?.length || 0
      });
    }

    if (isVoiceMode && voice.isConnected) voice.endVoiceSession();
    await onEnd(sessionResult);
  };
  const requestLiveHelp = useCallback(async (helpType) => {
    if (!latestAgentTurn) {
      setConversationSupport(null);
      setSupportError("Wait for your conversation partner to speak first.");
      return;
    }

    setSupportLoading(helpType);
    setSupportError("");

    if (isVoiceMode && helpType === "explanation") {
      voice.sendContextualUpdate(
        `The learner explicitly asked for help understanding your latest finalized message: "${latestAgentTurn.text}". Give one short English explanation, then repeat that Japanese line in a shorter, simpler form if needed. Do not add filler unless it is essential. Continue the roleplay afterward in Japanese.`,
        { contextId: `live-help:${latestAgentTurn.id}:explanation` }
      );
    }

    if (isVoiceMode && helpType === "repeat") {
      voice.sendContextualUpdate(
        `The learner asked you to repeat more slowly. Repeat only your latest finalized Japanese message more slowly: "${latestAgentTurn.text}". Do not introduce a new topic.`,
        { contextId: `live-help:${latestAgentTurn.id}:repeat` }
      );
    }

    try {
      const response = await fetch("/api/live-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenario: {
            id: scenario.id,
            name: scenario.name,
            role: scenario.role,
            description: scenario.description,
            shortGoal: scenario.shortGoal,
            goals: scenario.goals,
            politenessMode: scenario.politenessMode,
            registerLabel: scenario.registerLabel
          },
          supportLevel: settings.supportLevelLabel || getSupportLevelLabel(settings.supportLevel),
          helpType,
          latestAgentMessage: latestAgentTurn.text
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.support) {
        throw new Error("live-help-failed");
      }
      setConversationSupport({
        ...data.support,
        relatedAgentTurnId: latestAgentTurn.id
      });
    } catch {
      setConversationSupport(null);
      setSupportError("We couldn't prepare help for this message. Please try again.");
    } finally {
      setSupportLoading(null);
    }
  }, [isVoiceMode, latestAgentTurn, scenario, settings.supportLevel, settings.supportLevelLabel, voice]);

  const showHint = () => requestLiveHelp("hint");
  const explainLast = () => requestLiveHelp("explanation");
  const repeatSlower = () => requestLiveHelp("repeat");
  const formattedDuration = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const supportLabel = settings.supportLevelLabel || getSupportLevelLabel(settings.supportLevel);
  const composer = <div className="composer"><button className="mic-button" type="button" onClick={isVoiceMode && voice.isConnected ? voice.isListening ? voice.muteMicrophone : voice.unmuteMicrophone : undefined}>{isVoiceMode && voice.status === "Muted" ? <Pause/> : <Mic/>}</button><textarea rows="1" placeholder={isDemoMode ? "Demo responses are pre-filled..." : "Voice practice uses your microphone..."} disabled /></div>;
  const helpDisabled = Boolean(supportLoading) || !latestAgentTurn;
  const loadingMessage = supportLoading === "hint"
    ? "Preparing a hint…"
    : supportLoading === "explanation"
      ? "Explaining the last message…"
      : supportLoading === "repeat"
        ? "Preparing a slower repeat…"
        : "";
  const renderLiveHelpControls = () => <div className="live-help-controls">
    <button onClick={showHint} disabled={helpDisabled}><Lightbulb/><div><b>Give me a hint</b><span>See how you could reply</span></div></button>
    <button onClick={explainLast} disabled={helpDisabled}><CircleHelp/><div><b>I don’t understand</b><span>Explain the last message</span></div></button>
    <button onClick={repeatSlower} disabled={helpDisabled}><RotateCcw/><div><b>Repeat slower</b><span>Hear the last message again</span></div></button>
    {!latestAgentTurn && <p className="support-status">Wait for your conversation partner to speak first.</p>}
    {loadingMessage && <p className="support-status">{loadingMessage}</p>}
    {supportError && <p className="support-error">{supportError}</p>}
  </div>;
  const renderDisplaySettings = () => <div className="display-settings"><small>DISPLAY</small><div><Languages/><span><b>Romaji</b>Reading support</span><button className={`toggle ${romaji?"on":""}`} onClick={()=>setRomaji(!romaji)}><i/></button></div><div><Languages/><span><b>Translation</b>English meaning</span><button className={`toggle ${translation?"on":""}`} onClick={()=>setTranslation(!translation)}><i/></button></div></div>;
  return <div className={`app-screen conversation-page ${isVoiceMode ? "voice-session-active" : ""}`}>
    <header className="room-header"><div className="room-brand"><span>話</span> Kaiwa Lab</div><div className="room-title"><small>NOW PRACTICING</small><b>{scenario.name}</b><span>{scenario.role}</span></div><div className="room-badges"><span>{supportLabel}</span><span>{scenario.registerLabel || scenario.politenessMode}</span><span>{isVoiceMode ? "Live voice" : "Demo flow"}</span><b>{formattedDuration}</b><button onClick={endSession} disabled={ending}>{ending ? <AudioLines/> : <Square/>} {ending ? "Reviewing…" : "End session"}</button></div></header>
    {(isVoiceMode || isDemoMode) && <div className="mobile-bottom-dock" role="region" aria-label={isVoiceMode ? "Live voice practice controls" : "Demo flow controls"}>
      {composer}
      <div className="mobile-live-session-bar">
        <div><b>{formattedDuration}</b><span> · {ending ? "Ending session" : roomStatus}</span></div>
        <button type="button" onClick={endSession} disabled={ending}>{ending ? "Reviewing…" : "End session"}</button>
      </div>
    </div>}
    <div className="room-layout">
      <aside className="goals-panel">
        <small>SESSION PROGRESS</small><div className="goal-total"><b>{done}</b><span>of {scenario.goals.length}<br/>goals complete</span></div><div className="progress"><i style={{width: `${done/scenario.goals.length*100}%`}}/></div>
        <div className="goal-checks">{scenario.goals.map((g,i)=>{
          const complete = isVoiceMode ? completedGoalIndexes.has(i) : i < done;
          const current = isVoiceMode ? i === currentGoalIndex : i === done;
          return <div className={complete?"complete":""} key={g}><span>{complete?<Check/>:current?<ChevronRight/>:""}</span><p>{g}<small>{complete?"Completed":current?"Current goal":"Not yet"}</small></p></div>;
        })}</div>
        <div className="session-tip"><Lightbulb/><div><b>Session tip</b><span>Mistakes are welcome. Keep the conversation moving.</span></div></div>
      </aside>
      <section className="conversation-main" ref={scrollAreaRef} onScroll={updateNearBottom}>
        {ending && <div className="feedback-loading" role="status"><AudioLines/><div><b>{reviewMessage.title}</b><span>{reviewMessage.body}</span></div></div>}
        {isDemoMode && <div className="demo-banner"><Play/> <b>Demo flow</b> — sample conversation only <span>Step {count} of {scenarioTranscript.length}</span></div>}
        {isVoiceMode && voice.error && <div className="demo-banner"><AudioLines/> <b>{voice.error}</b> <button type="button" onClick={() => voice.startVoiceSession(sessionPayload)}>Try again</button> <button type="button" onClick={() => { voice.endVoiceSession(); setActiveMode("Demo Mode"); }}>View demo flow</button></div>}
        <div className="voice-stage"><span className="speaking-label">● {roomStatus.toUpperCase()}</span><div className="room-orb"><i/><i/><span><AudioLines/></span></div><p>{lastAi?.jp || (isVoiceMode ? "Voice practice is getting ready..." : scenario.opening)}</p>{romaji && <i>{lastAi?.romaji}</i>}</div>
        <div className="transcript-title"><b>Conversation</b><span>LIVE TRANSCRIPT</span></div>
        <div className="transcript">{transcript.map((m,i)=><TranscriptBubble key={isVoiceMode ? voice.transcriptEvents[i]?.id || i : i} message={m} romaji={romaji} translation={translation}/>)}</div>
        <div className="mobile-help-panel"><small>LIVE HELP</small><h3>Need a hand?</h3>{renderLiveHelpControls()}{renderDisplaySettings()}<LiveSupportPanel support={conversationSupport} onClear={() => setConversationSupport(null)} /></div>
        <div ref={transcriptEndRef} aria-hidden="true" />
        {isVoiceMode && showJumpLatest && <button type="button" className="jump-latest" onClick={scrollToLatest}>Jump to latest</button>}
        {isDemoMode && count < scenarioTranscript.length && <button className="btn btn-red demo-next" onClick={next}>Play next message <Play/> </button>}
        <div className={isVoiceMode ? "voice-inline-composer" : ""}>{composer}</div>
      </section>
      <aside className="help-panel">
        <small>LIVE HELP</small><h3>Need a hand?</h3>
        {renderLiveHelpControls()}
        {renderDisplaySettings()}
        <LiveSupportPanel support={conversationSupport} onClear={() => setConversationSupport(null)} />
      </aside>
    </div>
  </div>;
}
