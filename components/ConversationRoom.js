"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { AudioLines, Check, ChevronRight, CircleHelp, Languages, Lightbulb, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { mockTranscript } from "@/data/mockTranscript";
import { demoAccessExpiredMessage, useKaiwaVoiceConversation } from "@/hooks/useKaiwaVoiceConversation";
import { buildElevenLabsDynamicVariables } from "@/lib/scenarioPrompts";
import { getSupportLevelLabel } from "@/lib/practiceSettings";
import TranscriptBubble from "./TranscriptBubble";

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
  const [count, setCount] = useState(isDemoMode ? 1 : scenarioTranscript.length);
  const [romaji, setRomaji] = useState(settings.romaji);
  const [translation, setTranslation] = useState(settings.translation);
  const [help, setHelp] = useState(null);
  const [seconds, setSeconds] = useState(isVoiceMode ? 0 : 42);
  const [ending, setEnding] = useState(false);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const simpleHelpJapanese = useMemo(() => {
    const phrase = scenario.usefulPhrases[0] || scenario.opening;
    return phrase.replace(/どうぞ。?$/u, "").trim() || phrase;
  }, [scenario.opening, scenario.usefulPhrases]);
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

  const transcript = isVoiceMode ? voice.transcript : scenarioTranscript.slice(0, count);
  const finalizedMessageCount = isVoiceMode ? voice.finalTranscriptEvents.length : transcript.length;
  // Demo flow goal progress is intentionally mock-only. Real goal completion
  // will be generated after the session from the completed transcript via OpenAI feedback.
  const done = Math.min(3, Math.ceil(count / 2));
  const next = () => { setCount(c => Math.min(scenarioTranscript.length, c + 1)); setHelp(null); };
  const lastAi = [...transcript].reverse().find(m => m.speaker === "ai");
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
      goals: scenario.goals.map((goal, index) => ({ goal, completed: index < done })),
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
        transcript: sessionResult.transcript
      });
    }

    if (isVoiceMode && voice.isConnected) voice.endVoiceSession();
    await onEnd(sessionResult);
  };
  const showHint = () => {
    const phrase = scenario.usefulPhrases[Math.min(2,scenario.usefulPhrases.length-1)];
    if (isVoiceMode) {
      voice.sendContextualUpdate(`The learner asked for a short hint. Offer this as optional support if appropriate: ${phrase}`);
    }
    setHelp({type:"hint",label:"TRY SAYING",jp:phrase,romaji:"",en:"Optional phrase you can adapt to your answer."});
  };
  const explainLast = () => {
    if (isVoiceMode) {
      voice.sendContextualUpdate("The learner explicitly asked for help. Give one short English explanation, then repeat your previous Japanese line in a shorter, simpler form. Do not add filler such as douzo/どうぞ unless it is essential. Continue the roleplay afterward in Japanese.");
    }
    setHelp({type:"explain",label:"SIMPLE EXPLANATION",jp:simpleHelpJapanese,romaji:"",en:"Short help: answer the main question simply, then keep going in Japanese."});
  };
  const repeatSlower = () => {
    if (isVoiceMode) {
      voice.sendContextualUpdate("The learner asked you to repeat more slowly. Repeat the previous Japanese line slower and simpler.");
    }
    setHelp({type:"slower",label:"REPEAT SLOWER",jp:lastAi?.jp || scenario.opening,romaji:lastAi?.romaji || "",en:lastAi?.en || "The agent can repeat more slowly during voice practice."});
  };
  const formattedDuration = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const supportLabel = settings.supportLevelLabel || getSupportLevelLabel(settings.supportLevel);
  const composer = <div className="composer"><button className="mic-button" type="button" onClick={isVoiceMode && voice.isConnected ? voice.isListening ? voice.muteMicrophone : voice.unmuteMicrophone : undefined}>{isVoiceMode && voice.status === "Muted" ? <Pause/> : <Mic/>}</button><textarea rows="1" placeholder={isDemoMode ? "Demo responses are pre-filled..." : "Voice practice uses your microphone..."} disabled /></div>;
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
        <div className="goal-checks">{scenario.goals.map((g,i)=><div className={i<done?"complete":""} key={g}><span>{i<done?<Check/>:i===done?<ChevronRight/>:""}</span><p>{g}<small>{i<done?"Completed":i===done?"Current goal":"Not yet"}</small></p></div>)}</div>
        <div className="session-tip"><Lightbulb/><div><b>Session tip</b><span>Mistakes are welcome. Keep the conversation moving.</span></div></div>
      </aside>
      <section className="conversation-main" ref={scrollAreaRef} onScroll={updateNearBottom}>
        {ending && <div className="feedback-loading" role="status"><AudioLines/><div><b>Reviewing your conversation…</b><span>Checking your goals and finalized transcript.</span></div></div>}
        {isDemoMode && <div className="demo-banner"><Play/> <b>Demo flow</b> — sample conversation only <span>Step {count} of {scenarioTranscript.length}</span></div>}
        {isVoiceMode && voice.error && <div className="demo-banner"><AudioLines/> <b>{voice.error}</b> <button type="button" onClick={() => voice.startVoiceSession(sessionPayload)}>Try again</button> <button type="button" onClick={() => { voice.endVoiceSession(); setActiveMode("Demo Mode"); }}>View demo flow</button></div>}
        <div className="voice-stage"><span className="speaking-label">● {roomStatus.toUpperCase()}</span><div className="room-orb"><i/><i/><span><AudioLines/></span></div><p>{lastAi?.jp || (isVoiceMode ? "Voice practice is getting ready..." : scenario.opening)}</p>{romaji && <i>{lastAi?.romaji}</i>}</div>
        <div className="transcript-title"><b>Conversation</b><span>LIVE TRANSCRIPT</span></div>
        <div className="transcript">{transcript.map((m,i)=><TranscriptBubble key={isVoiceMode ? voice.transcriptEvents[i]?.id || i : i} message={m} romaji={romaji} translation={translation}/>)}</div>
        {help && <div className={`help-card ${help.type}`}><button onClick={()=>setHelp(null)}>×</button><small>{help.label}</small><b>{help.jp}</b>{romaji && <i>{help.romaji}</i>}<span>{help.en}</span></div>}
        <div ref={transcriptEndRef} aria-hidden="true" />
        {isVoiceMode && showJumpLatest && <button type="button" className="jump-latest" onClick={scrollToLatest}>Jump to latest</button>}
        {isDemoMode && count < scenarioTranscript.length && <button className="btn btn-red demo-next" onClick={next}>Play next message <Play/> </button>}
        <div className={isVoiceMode ? "voice-inline-composer" : ""}>{composer}</div>
      </section>
      <aside className="help-panel">
        <small>LIVE HELP</small><h3>Need a hand?</h3>
        <button onClick={showHint}><Lightbulb/><div><b>Give me a hint</b><span>See a useful phrase</span></div></button>
        <button onClick={explainLast}><CircleHelp/><div><b>I don’t understand</b><span>Explain in English</span></div></button>
        <button onClick={repeatSlower}><RotateCcw/><div><b>Repeat slower</b><span>Hear a simpler version</span></div></button>
        <div className="display-settings"><small>DISPLAY</small><div><Languages/><span><b>Romaji</b>Reading support</span><button className={`toggle ${romaji?"on":""}`} onClick={()=>setRomaji(!romaji)}><i/></button></div><div><Languages/><span><b>Translation</b>English meaning</span><button className={`toggle ${translation?"on":""}`} onClick={()=>setTranslation(!translation)}><i/></button></div></div>
        <div className="phrase-side"><small>USEFUL NOW</small>{scenario.usefulPhrases.slice(0,3).map((p)=><div key={p}><b>{p}</b>{romaji && <span>Display support only</span>}</div>)}</div>
      </aside>
    </div>
  </div>;
}
