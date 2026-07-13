import { ArrowRight, AudioLines, Check, CircleHelp, MessageSquareText, Mic2, Sparkles } from "lucide-react";
import ScenarioGrid from "./ScenarioGrid";
import ScreenshotMockups from "./ScreenshotMockups";

const features = [
  [Mic2, "Speak out loud", "Practice answering with your voice instead of only reading or memorizing."],
  [CircleHelp, "Get unstuck", "When words disappear, say it naturally and keep the conversation moving."],
  [MessageSquareText, "Review what to practice", "Finish with focused feedback on what worked and what to try next."]
];

const repairPhrases = [
  ["わかりません。", "Wakarimasen.", "I don't understand."],
  ["もう一度お願いします。", "Mou ichido onegaishimasu.", "One more time, please."],
  ["ゆっくりお願いします。", "Yukkuri onegaishimasu.", "Please speak slowly."]
];

export default function LandingPage({ onSelect, onDemo }) {
  return (
    <>
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Japanese conversation, made practical</div>
          <h1>Practice Japanese through <em>real conversations.</em></h1>
          <p>Speak with an AI tutor in everyday situations — from ramen shops to train stations. Practice listening, responding, and getting unstuck before using Japanese in real life.</p>
          <div className="hero-actions">
            <button className="btn btn-red" onClick={() => document.querySelector("#scenarios").scrollIntoView({ behavior: "smooth" })}>Start a conversation <ArrowRight size={17} /></button>
            <button className="btn btn-ghost" onClick={onDemo}><span className="play">▶</span> View demo flow</button>
          </div>
          <div className="hero-meta"><span><Check /> Voice-first practice</span><span><Check /> Built for beginners</span><span><Check /> Real-life scenarios</span></div>
        </div>
        <div className="hero-visual">
          <div className="japanese-stamp">会話<br/><small>practice</small></div>
          <div className="preview-card">
            <div className="preview-top"><div><small>NOW PRACTICING</small><strong>Ramen Shop <span>ラーメン屋</span></strong></div><span className="live-dot">● LIVE</span></div>
            <div className="orb-wrap"><div className="sound-ring ring1" /><div className="sound-ring ring2" /><div className="voice-orb"><AudioLines /></div></div>
            <p className="listening">Listening...</p>
            <div className="mini-transcript">
              <span className="avatar">花</span>
              <div><small>Kaiwa Lab Tutor</small><p>いらっしゃいませ。<br/>何名様ですか？</p><span>Welcome. How many people?</span></div>
            </div>
            <div className="goal-row"><span>Session goals</span><span>2 of 4</span></div>
            <div className="progress"><i style={{ width: "50%" }} /></div>
          </div>
          <div className="float-note"><Sparkles size={16}/><div><small>WHEN YOU GET STUCK</small><b>もう一度お願いします。</b><span>Say it during the conversation.</span></div></div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><span>VOICE ROLEPLAY</span><i/><span>BEGINNER SUPPORT</span><i/><span>REAL-WORLD SCENARIOS</span><i/><span>USEFUL FEEDBACK</span></div></section>

      <section className="section shell" id="how">
        <div className="section-kicker">WHY KAIWA LAB</div>
        <div className="section-heading"><h2>From “I understand it” to<br/><em>“I can say it.”</em></h2><p>Reading is different from replying in the moment. Kaiwa Lab gives beginners a place to practice speaking, get stuck, and recover before real life asks for an answer.</p></div>
        <div className="feature-grid">{features.map(([Icon, title, body], i) => <article className="feature" key={title}><span className="feature-num">0{i + 1}</span><div className="feature-icon"><Icon /></div><h3>{title}</h3><p>{body}</p></article>)}</div>
        <div className="repair-strip">
          <div className="repair-strip-intro">
            <div className="section-kicker">WHEN WORDS DISAPPEAR</div>
            <h3>Freeze? That&apos;s part of practice.</h3>
          </div>
          <div className="repair-list">
            {repairPhrases.map(([jp, romaji, english], i) =>
              <div className={`repair-item r${i}`} key={jp}><span>0{i + 1}</span><div><b>{jp}</b><i>{romaji}</i><p>{english}</p></div></div>
            )}
          </div>
        </div>
      </section>

      <section className="section scenarios-section" id="scenarios">
        <div className="shell">
          <div className="section-kicker">CHOOSE YOUR MOMENT</div>
          <div className="section-heading"><h2>Where do you want to<br/><em>feel more confident?</em></h2><p>Practice the situations where beginner Japanese suddenly has to become spoken Japanese.</p></div>
          <ScenarioGrid onSelect={onSelect} />
        </div>
      </section>

      <ScreenshotMockups onDemo={onDemo} />

      <section className="final-cta shell"><span className="jp-bg">話</span><div className="section-kicker">READY WHEN YOU ARE</div><h2>Your next Japanese<br/>conversation starts <em>here.</em></h2><p>Choose a scenario. Speak out loud. Make mistakes safely.<br/>Then step into real life a little more ready.</p><button className="btn btn-red" onClick={() => document.querySelector("#scenarios").scrollIntoView({ behavior: "smooth" })}>Start a conversation <ArrowRight size={17}/></button></section>
    </>
  );
}
