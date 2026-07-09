import { ArrowLeft, Check, Keyboard, Mic2, Play, ShieldCheck, X } from "lucide-react";

const levels = [
  ["N5 Beginner", "Short sentences, simple grammar, English hints, and a slower pace.", "やさしい"],
  ["N3 Intermediate", "Natural Japanese, follow-up questions, fewer hints, and less English.", "自然な会話"],
  ["N1 Advanced", "Nuance, indirect phrasing, and polished business Japanese.", "上級"]
];
const modes = [
  ["Demo Mode", Play, "Free preview"],
  ["Text Mode", Keyboard, "Practice with typing"],
  ["Voice Mode", Mic2, "Live AI voice - demo code required"]
];

export default function PracticeSetup({
  scenario,
  settings,
  setSettings,
  onBack,
  onStart,
  voiceUnlocked,
  unlockMessage,
  unlockError,
  unlocking,
  showDemoCodeModal,
  setShowDemoCodeModal,
  onUnlockVoice,
  onContinueDemo
}) {
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const selectMode = (name) => {
    if (name === "Voice Mode" && !voiceUnlocked) {
      setShowDemoCodeModal(true);
      return;
    }
    set("mode", name);
  };

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
          <fieldset><legend>Practice mode</legend><div className="mode-grid">{modes.map(([name, Icon, desc]) => <button className={settings.mode === name ? "active" : ""} onClick={() => selectMode(name)} key={name}><Icon/><b>{desc}</b><span>{name}</span>{name === "Demo Mode" && <small>NO MIC NEEDED</small>}</button>)}</div><p className="mode-note">Demo Mode is always free to try. Live Voice Mode is protected to prevent API abuse.</p></fieldset>
          <fieldset><legend>Conversation style</legend><div className="segmented">{["Polite", "Casual", "Business"].map(x => <button className={settings.politeness === x ? "active" : ""} onClick={() => set("politeness", x)} key={x}>{x}</button>)}</div></fieldset>
          <div className="toggle-row"><div><b>Show romaji</b><span>Reading support below Japanese</span></div><button className={`toggle ${settings.romaji ? "on" : ""}`} onClick={() => set("romaji", !settings.romaji)}><i/></button></div>
          <div className="toggle-row"><div><b>Show translation</b><span>Short English meaning below messages</span></div><button className={`toggle ${settings.translation ? "on" : ""}`} onClick={() => set("translation", !settings.translation)}><i/></button></div>
          {unlockMessage && <p className="unlock-success">{unlockMessage}</p>}
          {settings.mode === "Demo Mode" && <div className="demo-note"><Play/><div><b>Demo Mode — sample conversation only</b><span>Step through a complete session without microphone access.</span></div></div>}
          <button className="btn btn-red start-btn" onClick={onStart}>Start practice <span>→</span></button>
          <p className="secure-note"><ShieldCheck/> API credentials stay on secure backend routes.</p>
        </section>
      </div>
    </div>
    {showDemoCodeModal && (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="demo-code-title">
        <form className="demo-code-card" onSubmit={onUnlockVoice}>
          <button className="modal-close" type="button" onClick={() => setShowDemoCodeModal(false)} aria-label="Close demo code prompt"><X/></button>
          <small>VOICE MODE ACCESS</small>
          <h3 id="demo-code-title">Demo code required</h3>
          <p>Voice Mode uses live AI and is currently available by demo code.</p>
          <input name="demoCode" placeholder="Enter demo code" autoComplete="off" />
          {unlockError && <span className="unlock-error">{unlockError}</span>}
          <button className="btn btn-red" type="submit" disabled={unlocking}>{unlocking ? "Checking..." : "Unlock Voice Mode"}</button>
          <button className="demo-secondary" type="button" onClick={onContinueDemo}>Continue with Demo Mode</button>
        </form>
      </div>
    )}
  </div>;
}
