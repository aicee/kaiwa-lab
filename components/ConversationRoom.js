"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { AudioLines, Check, ChevronRight, CircleHelp, Languages, Lightbulb, Mic, Pause, Play, RotateCcw, Send, Square } from "lucide-react";
import { mockTranscript } from "@/data/mockTranscript";
import { useKaiwaVoiceConversation } from "@/hooks/useKaiwaVoiceConversation";
import { buildElevenLabsDynamicVariables } from "@/lib/scenarioPrompts";
import TranscriptBubble from "./TranscriptBubble";

export default function ConversationRoom({ scenario, settings, onEnd }) {
  return <ConversationProvider><ConversationRoomContent scenario={scenario} settings={settings} onEnd={onEnd} /></ConversationProvider>;
}

function ConversationRoomContent({ scenario, settings, onEnd }) {
  const [activeMode, setActiveMode] = useState(settings.mode);
  const isDemoMode = activeMode === "Demo Mode";
  const isTextMode = activeMode === "Text Mode";
  const isVoiceMode = activeMode === "Voice Mode";
  const voice = useKaiwaVoiceConversation();
  const voiceStartedRef = useRef(false);
  const scenarioTranscript = useMemo(() => [
    {
      speaker: "ai",
      jp: scenario.opening,
      romaji: "",
      en: ""
    },
    ...mockTranscript.slice(1)
  ], [scenario.opening]);
  const [count, setCount] = useState(isDemoMode || isTextMode ? 1 : scenarioTranscript.length);
  const [textTranscript, setTextTranscript] = useState(() => scenarioTranscript.slice(0, 1));
  const [draft, setDraft] = useState("");
  const [romaji, setRomaji] = useState(settings.romaji);
  const [translation, setTranslation] = useState(settings.translation);
  const [help, setHelp] = useState(null);
  const [seconds, setSeconds] = useState(isVoiceMode ? 0 : 42);
  const [ending, setEnding] = useState(false);
  const simpleHelpJapanese = useMemo(() => {
    const phrase = scenario.usefulPhrases[0] || scenario.opening;
    return phrase.replace(/どうぞ。?$/u, "").trim() || phrase;
  }, [scenario.opening, scenario.usefulPhrases]);
  const sessionPayload = useMemo(() => buildElevenLabsDynamicVariables({
    scenario,
    level: settings.level,
    politenessMode: settings.politeness,
    showRomaji: settings.romaji,
    showTranslation: settings.translation,
    practiceMode: "Voice Mode"
  }), [scenario, settings.level, settings.politeness, settings.romaji, settings.translation]);

  useEffect(() => {
    if (!isVoiceMode || voiceStartedRef.current) return;
    voiceStartedRef.current = true;
    voice.startVoiceSession(sessionPayload);
  }, [isVoiceMode, sessionPayload, voice]);

  useEffect(() => {
    if (isVoiceMode) return;
    setCount(1);
    setTextTranscript(scenarioTranscript.slice(0, 1));
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

  const transcript = isVoiceMode ? voice.transcript : isTextMode ? textTranscript : scenarioTranscript.slice(0, count);
  // Demo and Text Mode goal progress is intentionally mock-only. Real goal completion
  // will be generated after the session from the completed transcript via OpenAI feedback.
  const done = Math.min(3, Math.ceil(count / 2));
  const next = () => { setCount(c => Math.min(scenarioTranscript.length, c + 1)); setHelp(null); };
  const lastAi = [...transcript].reverse().find(m => m.speaker === "ai");
  const roomStatus = isVoiceMode ? voice.status : "Ready";
  const sendTextMessage = () => {
    const message = draft.trim();
    if (!isTextMode || !message) return;

    // Text Mode accepts any learner message. This mock reply sequence is temporary
    // until Text Mode is connected to a secure AI route.
    const nextAi = scenarioTranscript[count + 1];
    setTextTranscript((current) => [
      ...current,
      { speaker: "user", jp: message, romaji: "", en: "" },
      ...(nextAi?.speaker === "ai" ? [nextAi] : [])
    ]);
    setCount((current) => Math.min(scenarioTranscript.length, current + (nextAi?.speaker === "ai" ? 2 : 1)));
    setDraft("");
    setHelp(null);
  };
  const handleComposerKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendTextMessage();
  };
  const endSession = async () => {
    if (ending) return;
    setEnding(true);
    if (isVoiceMode) voice.endVoiceSession();
    await onEnd({
      scenario: { id: scenario.id, name: scenario.name, role: scenario.role },
      level: settings.level,
      politeness: settings.politeness,
      goals: scenario.goals.map((goal, index) => ({ goal, completed: index < done })),
      transcript: isVoiceMode ? voice.finalTranscript : transcript,
      voiceTranscriptEvents: isVoiceMode ? voice.finalTranscriptEvents : voice.transcriptEvents,
      conversationId: voice.conversationId,
      durationSeconds: seconds,
      mode: activeMode
    });
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
    setHelp({type:"slower",label:"REPEAT SLOWER",jp:lastAi?.jp || scenario.opening,romaji:lastAi?.romaji || "",en:lastAi?.en || "The agent can repeat more slowly during Voice Mode."});
  };
  return <div className="app-screen conversation-page">
    <header className="room-header"><div className="room-brand"><span>話</span> Kaiwa Lab</div><div className="room-title"><small>NOW PRACTICING</small><b>{scenario.name}</b><span>{scenario.role}</span></div><div className="room-badges"><span>{settings.level.split(" ")[0]}</span><span>{settings.politeness}</span><span>{activeMode}</span><b>{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</b><button onClick={endSession} disabled={ending}>{ending ? <AudioLines/> : <Square/>} {ending ? "Generating feedback…" : "End session"}</button></div></header>
    <div className="room-layout">
      <aside className="goals-panel">
        <small>SESSION PROGRESS</small><div className="goal-total"><b>{done}</b><span>of {scenario.goals.length}<br/>goals complete</span></div><div className="progress"><i style={{width: `${done/scenario.goals.length*100}%`}}/></div>
        <div className="goal-checks">{scenario.goals.map((g,i)=><div className={i<done?"complete":""} key={g}><span>{i<done?<Check/>:i===done?<ChevronRight/>:""}</span><p>{g}<small>{i<done?"Completed":i===done?"Current goal":"Not yet"}</small></p></div>)}</div>
        <div className="session-tip"><Lightbulb/><div><b>Session tip</b><span>Mistakes are welcome. Keep the conversation moving.</span></div></div>
      </aside>
      <section className="conversation-main">
        {ending && <div className="feedback-loading" role="status"><AudioLines/><div><b>Generating your feedback…</b><span>Reviewing your goals and conversation.</span></div></div>}
        {isDemoMode && <div className="demo-banner"><Play/> <b>Demo Mode</b> — sample conversation only <span>Step {count} of {scenarioTranscript.length}</span></div>}
        {isVoiceMode && voice.error && <div className="demo-banner"><AudioLines/> <b>{voice.error}</b> <button type="button" onClick={() => voice.startVoiceSession(sessionPayload)}>Try again</button> <button type="button" onClick={() => { voice.endVoiceSession(); setActiveMode("Demo Mode"); }}>Continue with Demo Mode</button> <button type="button" onClick={() => { voice.endVoiceSession(); setActiveMode("Text Mode"); }}>Continue with Text Mode</button></div>}
        <div className="voice-stage"><span className="speaking-label">● {roomStatus.toUpperCase()}</span><div className="room-orb"><i/><i/><span><AudioLines/></span></div><p>{lastAi?.jp || (isVoiceMode ? "Voice Mode is getting ready…" : scenario.opening)}</p>{romaji && <i>{lastAi?.romaji}</i>}</div>
        <div className="transcript-title"><b>Conversation</b><span>LIVE TRANSCRIPT</span></div>
        <div className="transcript">{transcript.map((m,i)=><TranscriptBubble key={i} message={m} romaji={romaji} translation={translation}/>)}</div>
        {help && <div className={`help-card ${help.type}`}><button onClick={()=>setHelp(null)}>×</button><small>{help.label}</small><b>{help.jp}</b>{romaji && <i>{help.romaji}</i>}<span>{help.en}</span></div>}
        {isDemoMode && count < scenarioTranscript.length && <button className="btn btn-red demo-next" onClick={next}>Play next message <Play/> </button>}
        <div className="composer"><button className="mic-button" type="button" onClick={isVoiceMode && voice.isConnected ? voice.isListening ? voice.muteMicrophone : voice.unmuteMicrophone : undefined}>{isVoiceMode && voice.status === "Muted" ? <Pause/> : <Mic/>}</button><textarea rows="1" placeholder={isDemoMode ? "Demo responses are pre-filled…" : isVoiceMode ? "Voice Mode uses your microphone…" : "Type your response in Japanese…"} disabled={isDemoMode || isVoiceMode} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown}/><button type="button" onClick={sendTextMessage} disabled={!isTextMode || !draft.trim()} aria-label="Send message"><Send/></button></div>
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
