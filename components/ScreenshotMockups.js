import { ArrowRight, CheckCircle2, Mic } from "lucide-react";

export default function ScreenshotMockups({ onDemo }) {
  return <section className="section mockup-section" id="demo"><div className="shell">
    <div className="section-kicker">SEE THE FULL JOURNEY</div>
    <div className="section-heading"><h2>Practice. Respond.<br/><em>Know what to improve.</em></h2><button className="text-link" onClick={onDemo}>Try the interactive demo <ArrowRight/></button></div>
    <div className="mockups">
      <div className="mock-frame small"><div className="browser-dots">● ● ●</div><div className="mock-body"><small>01 — SET YOUR PRACTICE</small><h3>Ramen Shop</h3><div className="mock-option selected">Guided <CheckCircle2/></div><div className="mock-option">Natural</div><div className="mock-option">Challenge</div><span className="mock-label">DISPLAY SUPPORT</span><div className="mock-pills"><b>Romaji on</b><b>Translation on</b></div><button>Start conversation →</button></div></div>
      <div className="mock-frame large"><div className="browser-dots">● ● ●</div><div className="mock-body conversation-mock"><div className="mock-sidebar"><b>ラーメン屋</b>{["Find a seat", "Ask recommendation", "Order ramen", "Ask for water"].map((x,i)=><span className={i<2?"done":""} key={x}>{i<2?"✓":"○"} {x}</span>)}</div><div className="mock-chat"><small>RAMEN SHOP · LIVE VOICE</small><div className="tiny-orb"><Mic/></div><div className="tiny-bubble">いらっしゃいませ。<br/>ご注文はお決まりですか？</div><div className="tiny-user">おすすめは何ですか？</div></div></div></div>
      <div className="mock-frame small"><div className="browser-dots">● ● ●</div><div className="mock-body report-mock"><small>03 — SESSION COMPLETE</small><h3>よくできました！</h3><div className="score-ring">86<small>/100</small></div><div className="report-line"><CheckCircle2/> 4 of 5 goals complete</div><div className="correction"><small>ONE USEFUL CORRECTION</small><del>水ください。</del><b>お水をください。</b></div><button>View full feedback →</button></div></div>
    </div>
  </div></section>;
}
