"use client";
import { ArrowRight, Check, CheckCircle2, Copy, Download, RotateCcw, Sparkles, Target, TrendingUp } from "lucide-react";
import { mockFeedback } from "@/data/mockFeedback";
import { useState } from "react";

export default function FeedbackReport({ scenario, settings, feedback, onRestart, onHarder, onNext }) {
  const f = feedback || mockFeedback;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(`Hanasu AI — ${scenario.title}: ${f.score}/100. ${f.wins.join(" ")}`); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return <div className="app-screen feedback-page"><div className="report-shell">
    <div className="report-top"><span className="success-mark"><Check/></span><div><small>SESSION COMPLETE</small><h1>よくできました！</h1><p>Nice work. Here’s what to carry into your next conversation.</p></div><div className="report-actions"><button onClick={copy}>{copied?<Check/>:<Copy/>} {copied?"Copied":"Copy summary"}</button><button onClick={()=>window.print()}><Download/> Download report</button></div></div>
    <div className="session-summary"><div><small>SCENARIO</small><b>{scenario.title}</b></div><div><small>LEVEL</small><b>{settings.level}</b></div><div><small>MODE</small><b>{settings.mode}</b></div><div><small>DURATION</small><b>04:18</b></div></div>
    <div className="feedback-grid">
      <aside>
        <div className="score-card"><small>OVERALL PERFORMANCE</small><div className="big-score"><b>{f.score}</b><span>/ 100</span></div><div className="score-bar"><i style={{width:`${f.score}%`}}/></div><h3>Strong conversation</h3><p>You communicated clearly and used polite language with growing confidence.</p><span className="level-pill"><TrendingUp/> On track for {settings.level.split(" ")[0]}</span></div>
        <div className="goals-report"><small>GOAL COMPLETION</small><h3>4 of 5 complete</h3>{scenario.goals.map((g,i)=><div key={g} className={i<4?"done":""}><span>{i<4?<Check/>:"○"}</span>{g}</div>)}</div>
      </aside>
      <main className="report-content">
        <section><div className="report-section-title"><span><Sparkles/></span><div><small>01</small><h2>What you did well</h2></div></div><ul className="win-list">{f.wins.map(x=><li key={x}><CheckCircle2/>{x}</li>)}</ul></section>
        <section><div className="report-section-title red"><span>直</span><div><small>02</small><h2>One useful correction</h2></div></div>{f.corrections.map(c=><div className="correction-card" key={c.said}><div><small>YOU SAID</small><del>{c.said}</del></div><ArrowRight/><div><small>MORE NATURAL</small><b>{c.better}</b></div><p><strong>Why:</strong> {c.why}</p></div>)}</section>
        <section><div className="report-section-title"><span>言</span><div><small>03</small><h2>Natural phrases for next time</h2></div></div><div className="natural-list">{f.phrases.map((x,i)=><div key={x}><span>0{i+1}</span><b>{x}</b></div>)}</div></section>
        <section><div className="report-section-title green"><span>語</span><div><small>04</small><h2>New vocabulary</h2></div></div><div className="vocab-grid">{f.vocabulary.map(([jp,romaji,en])=><div key={jp}><b>{jp}</b><i>{romaji}</i><span>{en}</span></div>)}</div></section>
        <div className="notes-grid"><section><small>GRAMMAR NOTE</small><h3>Polite requests with ください</h3><p>Use noun + を + ください to make a clear, polite request. In restaurants, お水をください sounds more natural than 水ください.</p></section><section><small>POLITENESS NOTE</small><h3>Small details sound warmer</h3><p>Polite forms like お願いします and the honorific お are a safe choice in customer-facing situations.</p></section></div>
        <section className="next-card"><div><small>SUGGESTED NEXT SCENARIO</small><h2>Cafe Order <span>カフェ</span></h2><p>Build on the same ordering language while practicing sizes, takeout, and preferences.</p></div><button onClick={onNext}>Set up scenario <ArrowRight/></button></section>
      </main>
    </div>
    <div className="bottom-actions"><button className="btn btn-ghost" onClick={onRestart}><RotateCcw/> Restart scenario</button><button className="btn btn-dark" onClick={onHarder}><Target/> Try a harder level</button></div>
  </div></div>;
}
