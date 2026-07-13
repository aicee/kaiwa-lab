import { ArrowLeft, Check, ShieldCheck, X } from "lucide-react";
import { getSupportLevel, supportLevels } from "@/lib/practiceSettings";

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
  const selectSupportLevel = (value) => {
    const support = getSupportLevel(value);
    setSettings((s) => ({
      ...s,
      supportLevel: support.value,
      supportLevelLabel: support.label
    }));
  };

  return <div className="app-screen setup-page">
    <div className="app-shell">
      <button className="back-link" onClick={onBack}><ArrowLeft/> All scenarios</button>
      <div className="setup-layout">
        <aside className="setup-summary">
          <small>YOUR SCENARIO</small><span className="big-jp">{scenario.jp}</span><h1>{scenario.name}</h1><p>{scenario.description}</p>
          <div className="role-box"><span>YOU'LL TALK TO</span><b>{scenario.role}</b><span>ESTIMATED TIME</span><b>{scenario.estimatedTime}</b></div>
          <h4>Session goals</h4><ul>{scenario.goals.map(g => <li key={g}><Check/> {g}</li>)}</ul>
          <div className="phrases-box"><small>USEFUL PHRASES</small>{scenario.usefulPhrases.slice(0,3).map(p => <span key={p}>{p}</span>)}</div>
        </aside>
        <section className="setup-form">
          <div className="step-label">PRACTICE SETUP <span>LIVE VOICE PRACTICE</span></div>
          <h2>Make this session <em>yours.</em></h2><p className="lead">You can change these settings before every practice.</p>
          <fieldset><legend>How much help do you want?</legend><div className="choice-list">{supportLevels.map((support) => <button type="button" className={settings.supportLevel === support.value ? "active" : ""} onClick={() => selectSupportLevel(support.value)} key={support.value}><span className="radio"/><div><b>{support.label}</b><p>{support.description}</p></div></button>)}</div></fieldset>
          {unlockMessage && <p className="unlock-success">{unlockMessage}</p>}
          <button className="btn btn-red start-btn" onClick={onStart}>Start conversation <span>→</span></button>
          <p className="secure-note"><ShieldCheck/> API credentials stay on secure backend routes.</p>
        </section>
      </div>
    </div>
    {showDemoCodeModal && (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="demo-code-title">
        <form className="demo-code-card" onSubmit={onUnlockVoice}>
          <button className="modal-close" type="button" onClick={() => setShowDemoCodeModal(false)} aria-label="Close demo code prompt"><X/></button>
          <small>LIVE VOICE ACCESS</small>
          <h3 id="demo-code-title">Demo code required</h3>
          <p>Kaiwa Lab uses live AI voice for real conversation practice. Enter your demo code to start speaking.</p>
          <input name="demoCode" placeholder="Enter demo code" autoComplete="off" />
          {unlockError && <span className="unlock-error">{unlockError}</span>}
          <button className="btn btn-red" type="submit" disabled={unlocking}>{unlocking ? "Checking..." : "Unlock voice practice"}</button>
          <button className="demo-secondary" type="button" onClick={onContinueDemo}>View demo flow</button>
        </form>
      </div>
    )}
  </div>;
}
