"use client";
import { useEffect, useState } from "react";
import { AudioLines, Check, ChevronRight, CircleHelp, Languages, Lightbulb, Mic, Pause, Play, RotateCcw, Send, Square } from "lucide-react";
import { mockTranscript } from "@/data/mockTranscript";
import TranscriptBubble from "./TranscriptBubble";

export default function ConversationRoom({ scenario, settings, onEnd }) {
  const isDemoMode = settings.mode === "Demo Mode";
  const isTextMode = settings.mode === "Text Mode";
  const [count, setCount] = useState(isDemoMode || isTextMode ? 1 : mockTranscript.length);
  const [textTranscript, setTextTranscript] = useState(() => mockTranscript.slice(0, 1));
  const [draft, setDraft] = useState("");
  const [romaji, setRomaji] = useState(settings.romaji);
  const [translation, setTranslation] = useState(settings.translation);
  const [help, setHelp] = useState(null);
  const [seconds, setSeconds] = useState(42);
  const [ending, setEnding] = useState(false);
  useEffect(() => { const timer = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(timer); }, []);
  const transcript = isTextMode ? textTranscript : mockTranscript.slice(0, count);
  const done = Math.min(3, Math.ceil(count / 2));
  const next = () => { setCount(c => Math.min(mockTranscript.length, c + 1)); setHelp(null); };
  const lastAi = [...transcript].reverse().find(m => m.speaker === "ai");
  const sendTextMessage = () => {
    const message = draft.trim();
    if (!isTextMode || !message) return;

    const nextAi = mockTranscript[count + 1];
    setTextTranscript((current) => [
      ...current,
      { speaker: "user", jp: message, romaji: "", en: "" },
      ...(nextAi?.speaker === "ai" ? [nextAi] : [])
    ]);
    setCount((current) => Math.min(mockTranscript.length, current + (nextAi?.speaker === "ai" ? 2 : 1)));
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
    await onEnd({
      scenario: { id: scenario.id, title: scenario.title, role: scenario.role },
      level: settings.level,
      politeness: settings.politeness,
      goals: scenario.goals.map((goal, index) => ({ goal, completed: index < done })),
      transcript,
      durationSeconds: seconds,
      mode: settings.mode
    });
  };
  return <div className="app-screen conversation-page">
    <header className="room-header"><div className="room-brand"><span>話</span> Kaiwa Lab</div><div className="room-title"><small>NOW PRACTICING</small><b>{scenario.title}</b><span>{scenario.role}</span></div><div className="room-badges"><span>{settings.level.split(" ")[0]}</span><span>{settings.politeness}</span><span>{settings.mode}</span><b>{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</b><button onClick={endSession} disabled={ending}>{ending ? <AudioLines/> : <Square/>} {ending ? "Generating feedback…" : "End session"}</button></div></header>
    <div className="room-layout">
      <aside className="goals-panel">
        <small>SESSION PROGRESS</small><div className="goal-total"><b>{done}</b><span>of {scenario.goals.length}<br/>goals complete</span></div><div className="progress"><i style={{width: `${done/scenario.goals.length*100}%`}}/></div>
        <div className="goal-checks">{scenario.goals.map((g,i)=><div className={i<done?"complete":""} key={g}><span>{i<done?<Check/>:i===done?<ChevronRight/>:""}</span><p>{g}<small>{i<done?"Completed":i===done?"Current goal":"Not yet"}</small></p></div>)}</div>
        <div className="session-tip"><Lightbulb/><div><b>Session tip</b><span>Mistakes are welcome. Keep the conversation moving.</span></div></div>
      </aside>
      <section className="conversation-main">
        {ending && <div className="feedback-loading" role="status"><AudioLines/><div><b>Generating your feedback…</b><span>Reviewing your goals and conversation.</span></div></div>}
        {settings.mode === "Demo Mode" && <div className="demo-banner"><Play/> <b>Demo Mode</b> — sample conversation only <span>Step {count} of {mockTranscript.length}</span></div>}
        <div className="voice-stage"><span className="speaking-label">● HANASU AI IS SPEAKING</span><div className="room-orb"><i/><i/><span><AudioLines/></span></div><p>{lastAi?.jp}</p>{romaji && <i>{lastAi?.romaji}</i>}</div>
        <div className="transcript-title"><b>Conversation</b><span>LIVE TRANSCRIPT</span></div>
        <div className="transcript">{transcript.map((m,i)=><TranscriptBubble key={i} message={m} romaji={romaji} translation={translation}/>)}</div>
        {help && <div className={`help-card ${help.type}`}><button onClick={()=>setHelp(null)}>×</button><small>{help.label}</small><b>{help.jp}</b>{romaji && <i>{help.romaji}</i>}<span>{help.en}</span></div>}
        {settings.mode === "Demo Mode" && count < mockTranscript.length && <button className="btn btn-red demo-next" onClick={next}>Play next message <Play/> </button>}
        <div className="composer"><button className="mic-button" type="button"><Mic/></button><textarea rows="1" placeholder={settings.mode === "Demo Mode" ? "Demo responses are pre-filled…" : "Type your response in Japanese…"} disabled={settings.mode === "Demo Mode"} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown}/><button type="button" onClick={sendTextMessage} disabled={!isTextMode || !draft.trim()} aria-label="Send message"><Send/></button></div>
      </section>
      <aside className="help-panel">
        <small>LIVE HELP</small><h3>Need a hand?</h3>
        <button onClick={()=>setHelp({type:"hint",label:"TRY SAYING",jp:scenario.phrases[Math.min(2,scenario.phrases.length-1)],romaji:"Raamen o hitotsu kudasai.",en:"One ramen, please."})}><Lightbulb/><div><b>Give me a hint</b><span>See a useful phrase</span></div></button>
        <button onClick={()=>setHelp({type:"explain",label:"SIMPLE EXPLANATION",jp:lastAi.jp,romaji:lastAi.romaji,en:lastAi.en})}><CircleHelp/><div><b>I don’t understand</b><span>Explain in English</span></div></button>
        <button onClick={()=>setHelp({type:"slower",label:"REPEAT SLOWER",jp:"ご・ちゅう・もん・は？",romaji:"Go-chuu-mon wa?",en:"Your order?"})}><RotateCcw/><div><b>Repeat slower</b><span>Hear a simpler version</span></div></button>
        <div className="display-settings"><small>DISPLAY</small><div><Languages/><span><b>Romaji</b>Reading support</span><button className={`toggle ${romaji?"on":""}`} onClick={()=>setRomaji(!romaji)}><i/></button></div><div><Languages/><span><b>Translation</b>English meaning</span><button className={`toggle ${translation?"on":""}`} onClick={()=>setTranslation(!translation)}><i/></button></div></div>
        <div className="phrase-side"><small>USEFUL NOW</small>{scenario.phrases.slice(0,3).map((p,i)=><div key={p}><b>{p}</b>{romaji && <span>{["Sumimasen","Osusume wa nan desu ka?","Raamen o hitotsu kudasai"][i]}</span>}</div>)}</div>
      </aside>
    </div>
  </div>;
}
