import { ArrowLeft, Check, Keyboard, Mic2, Play, ShieldCheck } from "lucide-react";

const levels = [
  ["N5 Beginner", "Short sentences, simple grammar, English hints, and a slower pace.", "やさしい"],
  ["N3 Intermediate", "Natural Japanese, follow-up questions, fewer hints, and less English.", "自然な会話"],
  ["N1 Advanced", "Nuance, indirect phrasing, and polished business Japanese.", "上級"]
];
const modes = [["Voice Mode", Mic2, "Speak with the AI tutor"], ["Text Mode", Keyboard, "Type each response"], ["Demo Mode", Play, "Sample conversation only"]];

export default function PracticeSetup({ scenario, settings, setSettings, onBack, onStart }) {
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  return <div className="app-screen setup-page">
    <div className="app-shell">
      <button className="back-link" onClick={onBack}><ArrowLeft/> All scenarios</button>
      <div className="setup-layout">
        <aside className="setup-summary">
          <small>YOUR SCENARIO</small><span className="big-jp">{scenario.jp}</span><h1>{scenario.title}</h1><p>{scenario.description}</p>
          <div className="role-box"><span>AI ROLE</span><b>{scenario.role}</b><span>ESTIMATED TIME</span><b>{scenario.time}</b></div>
          <h4>Session goals</h4><ul>{scenario.goals.map(g => <li key={g}><Check/> {g}</li>)}</ul>
          <div className="phrases-box"><small>USEFUL PHRASES</small>{scenario.phrases.slice(0,3).map(p => <span key={p}>{p}</span>)}</div>
        </aside>
        <section className="setup-form">
          <div className="step-label">PRACTICE SETUP <span>01 / 03</span></div>
          <h2>Make this session <em>yours.</em></h2><p className="lead">You can change these settings before every practice.</p>
          <fieldset><legend>Choose your level</legend><div className="choice-list">{levels.map(([name, desc, jp]) => <button className={settings.level === name ? "active" : ""} onClick={() => set("level", name)} key={name}><span className="radio"/><div><b>{name}</b><p>{desc}</p></div><small>{jp}</small></button>)}</div></fieldset>
          <fieldset><legend>Practice mode</legend><div className="mode-grid">{modes.map(([name, Icon, desc]) => <button className={settings.mode === name ? "active" : ""} onClick={() => set("mode", name)} key={name}><Icon/><b>{name}</b><span>{desc}</span>{name === "Demo Mode" && <small>NO MIC NEEDED</small>}</button>)}</div></fieldset>
          <fieldset><legend>Conversation style</legend><div className="segmented">{["Polite", "Casual", "Business"].map(x => <button className={settings.politeness === x ? "active" : ""} onClick={() => set("politeness", x)} key={x}>{x}</button>)}</div></fieldset>
          <div className="toggle-row"><div><b>Show romaji</b><span>Reading support below Japanese</span></div><button className={`toggle ${settings.romaji ? "on" : ""}`} onClick={() => set("romaji", !settings.romaji)}><i/></button></div>
          <div className="toggle-row"><div><b>Show translation</b><span>Short English meaning below messages</span></div><button className={`toggle ${settings.translation ? "on" : ""}`} onClick={() => set("translation", !settings.translation)}><i/></button></div>
          {settings.mode === "Demo Mode" && <div className="demo-note"><Play/><div><b>Demo Mode — sample conversation only</b><span>Step through a complete session without microphone access.</span></div></div>}
          <button className="btn btn-red start-btn" onClick={onStart}>Start practice <span>→</span></button>
          <p className="secure-note"><ShieldCheck/> API credentials stay on secure backend routes.</p>
        </section>
      </div>
    </div>
  </div>;
}
