import { ArrowRight, AudioLines, BrainCircuit, Check, MessageSquareText, Mic2, Sparkles } from "lucide-react";
import ScenarioGrid from "./ScenarioGrid";
import ScreenshotMockups from "./ScreenshotMockups";

const features = [
  [Mic2, "Speak naturally", "Practice aloud with a voice-first tutor, or type when you prefer."],
  [BrainCircuit, "Learns your level", "From supported N5 exchanges to nuanced N1 conversation."],
  [MessageSquareText, "Feedback that sticks", "Get focused corrections, vocabulary, and a clear next step."]
];

export default function LandingPage({ onSelect, onDemo }) {
  return (
    <>
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Japanese conversation, made practical</div>
          <h1>Practice Japanese through <em>real conversations.</em></h1>
          <p>Speak or type with an AI tutor in everyday situations — from ramen shops to job interviews. Build confidence first, then use it out there.</p>
          <div className="hero-actions">
            <button className="btn btn-red" onClick={() => document.querySelector("#scenarios").scrollIntoView({ behavior: "smooth" })}>Start a scenario <ArrowRight size={17} /></button>
            <button className="btn btn-ghost" onClick={onDemo}><span className="play">▶</span> View demo flow</button>
          </div>
          <div className="hero-meta"><span><Check /> 12 real-life scenarios</span><span><Check /> N5 to N1 levels</span><span><Check /> No sign-up needed</span></div>
        </div>
        <div className="hero-visual">
          <div className="japanese-stamp">会話<br/><small>practice</small></div>
          <div className="preview-card">
            <div className="preview-top"><div><small>NOW PRACTICING</small><strong>Ramen Shop <span>ラーメン屋</span></strong></div><span className="live-dot">● LIVE</span></div>
            <div className="orb-wrap"><div className="sound-ring ring1" /><div className="sound-ring ring2" /><div className="voice-orb"><AudioLines /></div></div>
            <p className="listening">Listening...</p>
            <div className="mini-transcript">
              <span className="avatar">花</span>
              <div><small>HANASU AI</small><p>いらっしゃいませ。<br/>何名様ですか？</p><span>Welcome. How many people?</span></div>
            </div>
            <div className="goal-row"><span>Session goals</span><span>2 of 4</span></div>
            <div className="progress"><i style={{ width: "50%" }} /></div>
          </div>
          <div className="float-note"><Sparkles size={16}/><div><small>LIVE SUGGESTION</small><b>おすすめは何ですか？</b><span>What do you recommend?</span></div></div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><span>VOICE ROLEPLAY</span><i/><span>ADAPTIVE JLPT LEVELS</span><i/><span>REAL-WORLD SCENARIOS</span><i/><span>USEFUL FEEDBACK</span></div></section>

      <section className="section shell" id="how">
        <div className="section-kicker">WHY HANASU</div>
        <div className="section-heading"><h2>From “I understand it” to<br/><em>“I can say it.”</em></h2><p>Textbooks teach you the pieces. Kaiwa Lab helps you put them together in the moments that matter.</p></div>
        <div className="feature-grid">{features.map(([Icon, title, body], i) => <article className="feature" key={title}><span className="feature-num">0{i + 1}</span><div className="feature-icon"><Icon /></div><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="section scenarios-section" id="scenarios">
        <div className="shell">
          <div className="section-kicker">CHOOSE YOUR MOMENT</div>
          <div className="section-heading"><h2>Where do you want to<br/><em>feel more confident?</em></h2><p>12 real-life roleplay scenes across food, travel, daily life, and work.</p></div>
          <ScenarioGrid onSelect={onSelect} />
        </div>
      </section>

      <section className="section levels shell">
        <div className="level-intro"><div className="section-kicker">YOUR LEVEL, YOUR PACE</div><h2>Start with support.<br/><em>Speak with less help over time.</em></h2><p>Beginner mode gives you more hints and a slower pace. Higher levels use less help and more natural Japanese.</p></div>
        <div className="level-list">
          {[["N5", "Beginner", "Short sentences · English hints · Slower pace", "やさしく話しましょう。"], ["N3", "Intermediate", "Natural Japanese · Follow-up questions · Fewer hints", "もう少し詳しく教えてください。"], ["N1", "Advanced", "Nuance · Indirect phrasing · Business Japanese", "ご経験についてお聞かせいただけますか。"]].map((l, i) =>
            <div className={`level-item l${i}`} key={l[0]}><span className="level-badge">{l[0]}</span><div><h3>{l[1]}</h3><p>{l[2]}</p></div><b>{l[3]}</b></div>
          )}
        </div>
      </section>

      <ScreenshotMockups onDemo={onDemo} />

      <section className="final-cta shell"><span className="jp-bg">話</span><div className="section-kicker">READY WHEN YOU ARE</div><h2>Your next Japanese<br/>conversation starts <em>here.</em></h2><p>Choose a scenario. Try the words. Make mistakes safely.<br/>Then step into real life a little more ready.</p><button className="btn btn-red" onClick={() => document.querySelector("#scenarios").scrollIntoView({ behavior: "smooth" })}>Start practicing <ArrowRight size={17}/></button></section>
    </>
  );
}
