"use client";
import { ArrowRight, Check, CheckCircle2, Copy, Download, RotateCcw, Sparkles, Target, TrendingUp } from "lucide-react";
import { mockFeedback } from "@/data/mockFeedback";
import { scenarios } from "@/data/scenarios";
import { useMemo, useState } from "react";

function formatDuration(seconds) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return "04:18";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(Math.floor(total % 60)).padStart(2, "0")}`;
}

function normalizeFeedback(feedback, scenario) {
  if (typeof feedback?.overallScore === "number") {
    return {
      ...feedback,
      isStructured: true,
      source: feedback.source || "openai",
      message: feedback.message || ""
    };
  }

  const sample = feedback || mockFeedback;
  const nextScenarioId = scenario.next || scenarios.find((item) => item.id !== scenario.id)?.id || scenarios[0]?.id;
  return {
    overallScore: sample.score,
    performanceLabel: sample.source === "sample" ? "Sample report" : "Strong conversation",
    performanceSummary: sample.message || "You communicated clearly and used polite language with growing confidence.",
    goalCompletion: scenario.goals.map((goal, index) => ({
      goal,
      status: index < 4 ? "completed" : "not_completed",
      evidence: "Sample report content."
    })),
    strengths: sample.wins.map((win) => ({ title: win, explanation: win, evidence: "Sample report content." })),
    corrections: sample.corrections.map((correction) => ({
      userSaid: correction.said,
      betterJapanese: correction.better,
      romaji: "",
      explanation: correction.why
    })),
    naturalPhrases: sample.phrases.map((phrase) => ({
      japanese: phrase,
      romaji: "",
      english: "Useful phrase for a similar conversation.",
      reason: "Sample report content."
    })),
    vocabulary: sample.vocabulary.map(([japanese, romaji, english]) => ({
      japanese,
      reading: "",
      romaji,
      english,
      context: "Sample report content."
    })),
    misunderstoodLanguage: [],
    grammarNote: {
      title: "Polite requests with ください",
      explanation: "Use noun + を + ください to make a clear, polite request. In restaurants, お水をください sounds more natural than 水ください."
    },
    politenessNote: {
      title: "Small details sound warmer",
      explanation: "Polite forms like お願いします and the honorific お are a safe choice in customer-facing situations."
    },
    keyFocus: {
      title: "Keep practicing short polite requests",
      explanation: "Aim for clear noun phrases plus お願いします or ください.",
      practiceExample: "お水をください。"
    },
    suggestedNextScenario: {
      scenarioId: nextScenarioId,
      reason: "Build on the same ordering language while practicing sizes, takeout, and preferences."
    },
    retryChallenge: "Try the scenario again and complete one more goal in Japanese.",
    source: sample.source || "mock",
    message: sample.message || "",
    isStructured: false
  };
}

function goalLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "partial") return "Partial";
  return "Not completed";
}

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text || "");
}

function isEnglishHelpPhrase(text) {
  const normalized = (text || "").trim().toLowerCase().replace(/[.!?]+$/, "");
  return normalized === "i don't understand" || normalized === "i dont understand";
}

function getDisplayFeedback(feedback) {
  return {
    ...feedback,
    misunderstoodLanguage: feedback.misunderstoodLanguage.filter((item) => (
      containsJapanese(item.japanese) &&
      !isEnglishHelpPhrase(item.japanese)
    ))
  };
}

function buildSummary({ scenario, settings, duration, feedback, nextScenario }) {
  const lines = [
    "Kaiwa Lab Practice Summary",
    "",
    `Scenario: ${scenario.name}`,
    `Level: ${settings.level}`,
    `Duration: ${duration}`,
    "",
    `Overall score: ${feedback.overallScore}/100`,
    feedback.performanceSummary,
    "",
    "Goal completion:",
    ...(feedback.goalCompletion.length ? feedback.goalCompletion.map((item) => `- ${item.goal}: ${goalLabel(item.status)}. ${item.evidence}`) : ["- Sample goal analysis only."]),
    "",
    "What went well:",
    ...feedback.strengths.map((item) => `- ${item.title}: ${item.explanation}`)
  ];

  if (feedback.corrections.length) {
    lines.push("", "Corrections:", ...feedback.corrections.map((item) => `- You said: ${item.userSaid} | Better: ${item.betterJapanese} | ${item.explanation}`));
  }

  if (feedback.misunderstoodLanguage.length) {
    lines.push("", "Words or phrases to review:", ...feedback.misunderstoodLanguage.map((item) => `- ${item.japanese} (${item.romaji}): ${item.english}. ${item.explanation}`));
  }

  lines.push(
    "",
    "Natural phrases:",
    ...feedback.naturalPhrases.map((item) => `- ${item.japanese}${item.romaji ? ` (${item.romaji})` : ""}: ${item.english}. ${item.reason}`),
    "",
    "Vocabulary:",
    ...feedback.vocabulary.map((item) => `- ${item.japanese}${item.romaji ? ` (${item.romaji})` : ""}: ${item.english}`),
    "",
    `Key focus: ${feedback.keyFocus.title}. ${feedback.keyFocus.explanation}`,
    `Practice example: ${feedback.keyFocus.practiceExample}`,
    "",
    `Suggested next scenario: ${nextScenario?.name || feedback.suggestedNextScenario.scenarioId}`,
    feedback.suggestedNextScenario.reason
  );

  return lines.join("\n");
}

export default function FeedbackReport({ scenario, settings, feedback, sessionResult, onRestart, onHarder, onNext }) {
  const [copied, setCopied] = useState(false);
  const f = useMemo(() => getDisplayFeedback(normalizeFeedback(feedback, scenario)), [feedback, scenario]);
  const duration = formatDuration(sessionResult?.duration || sessionResult?.durationSeconds);
  const nextScenario = scenarios.find((item) => item.id === f.suggestedNextScenario.scenarioId);
  const completedGoals = f.goalCompletion.filter((item) => item.status === "completed").length;
  const fallbackNotice = f.source === "sample" || f.source === "mock" ? f.message || "We couldn't generate live feedback, so here's a sample report." : "";
  const correctionTitle = f.corrections.length ? "Useful corrections" : "One thing to keep practicing";

  const copy = () => {
    navigator.clipboard?.writeText(buildSummary({ scenario, settings, duration, feedback: f, nextScenario }));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return <div className="app-screen feedback-page"><div className="report-shell">
    <div className="report-top"><span className="success-mark"><Check/></span><div><small>SESSION COMPLETE</small><h1>よくできました！</h1><p>Nice work. Here’s what to carry into your next conversation.</p></div><div className="report-actions"><button onClick={copy}>{copied?<Check/>:<Copy/>} {copied?"Copied":"Copy summary"}</button><button onClick={()=>window.print()}><Download/> Download report</button></div></div>
    {fallbackNotice && <div className="feedback-notice">{fallbackNotice}</div>}
    <div className="session-summary"><div><small>SCENARIO</small><b>{scenario.name}</b></div><div><small>LEVEL</small><b>{settings.level}</b></div><div><small>MODE</small><b>{settings.mode}</b></div><div><small>DURATION</small><b>{duration}</b></div></div>
    <div className="feedback-grid">
      <aside>
        <div className="score-card"><small>OVERALL PERFORMANCE</small><div className="big-score"><b>{f.overallScore}</b><span>/ 100</span></div><div className="score-bar"><i style={{width:`${f.overallScore}%`}}/></div><h3>{f.performanceLabel}</h3><p>{f.performanceSummary}</p><p className="score-disclaimer">This score reflects this practice conversation, not an official JLPT assessment.</p><span className="level-pill"><TrendingUp/> On track for {settings.level.split(" ")[0]}</span></div>
        <div className="goals-report"><small>GOAL COMPLETION</small><h3>{completedGoals} of {f.goalCompletion.length || scenario.goals.length} complete</h3>{(f.goalCompletion.length ? f.goalCompletion : scenario.goals.map((goal) => ({ goal, status: "not_completed", evidence: "Sample report content." }))).map((item)=><div key={item.goal} className={item.status==="completed"?"done":""}><span>{item.status==="completed"?<Check/>:item.status==="partial"?"◐":"○"}</span>{item.goal}<small>{goalLabel(item.status)}</small></div>)}</div>
      </aside>
      <main className="report-content">
        <section><div className="report-section-title"><span><Sparkles/></span><div><small>01</small><h2>What you did well</h2></div></div><ul className="win-list">{f.strengths.map((x)=><li key={`${x.title}:${x.evidence}`}><CheckCircle2/><span><b>{x.title}</b>{x.explanation}<small>{x.evidence}</small></span></li>)}</ul></section>
        <section><div className="report-section-title red"><span>直</span><div><small>02</small><h2>{correctionTitle}</h2></div></div>{f.corrections.length ? f.corrections.map(c=><div className="correction-card" key={`${c.userSaid}:${c.betterJapanese}`}><div><small>YOU SAID</small><del>{c.userSaid}</del></div><ArrowRight/><div><small>MORE NATURAL</small><b>{c.betterJapanese}</b>{c.romaji && <i>{c.romaji}</i>}</div><p><strong>Why:</strong> {c.explanation}</p></div>) : <div className="practice-focus"><h3>{f.keyFocus.title}</h3><p>{f.keyFocus.explanation}</p><b>{f.keyFocus.practiceExample}</b></div>}</section>
        {f.misunderstoodLanguage.length > 0 && <section><div className="report-section-title green"><span>聞</span><div><small>03</small><h2>Words or phrases to review</h2></div></div><div className="vocab-grid">{f.misunderstoodLanguage.map((item)=><div key={`${item.japanese}:${item.learnerContext}`}><b>{item.japanese}</b><i>{item.romaji || item.reading}</i><span>{item.english}</span><small>{item.explanation}</small></div>)}</div></section>}
        <section><div className="report-section-title"><span>言</span><div><small>{f.misunderstoodLanguage.length ? "04" : "03"}</small><h2>Natural phrases for next time</h2></div></div><div className="natural-list">{f.naturalPhrases.map((x,i)=><div key={`${x.japanese}:${x.reason}`}><span>0{i+1}</span><div><b>{x.japanese}</b><i>{x.romaji}</i><small><strong>{x.english}</strong> · {x.reason}</small></div></div>)}</div></section>
        <section><div className="report-section-title green"><span>語</span><div><small>{f.misunderstoodLanguage.length ? "05" : "04"}</small><h2>New vocabulary</h2></div></div><div className="vocab-grid">{f.vocabulary.map((item)=><div key={`${item.japanese}:${item.english}`}><b>{item.japanese}</b><i>{item.romaji || item.reading}</i><span>{item.english}</span><small>{item.context}</small></div>)}</div></section>
        <div className="notes-grid"><section><small>GRAMMAR NOTE</small><h3>{f.grammarNote.title}</h3><p>{f.grammarNote.explanation}</p></section><section><small>POLITENESS NOTE</small><h3>{f.politenessNote.title}</h3><p>{f.politenessNote.explanation}</p></section></div>
        <section><div className="report-section-title"><span>焦</span><div><small>FOCUS</small><h2>One thing to focus on next</h2></div></div><div className="practice-focus"><h3>{f.keyFocus.title}</h3><p>{f.keyFocus.explanation}</p><b>{f.keyFocus.practiceExample}</b></div></section>
        <section className="next-card"><div><small>SUGGESTED NEXT SCENARIO</small><h2>{nextScenario?.name || "Next practice"} <span>{nextScenario?.jp || ""}</span></h2><p>{f.suggestedNextScenario.reason}</p></div><button onClick={() => onNext?.(f.suggestedNextScenario.scenarioId)}>Set up scenario <ArrowRight/></button></section>
      </main>
    </div>
    <div className="bottom-actions"><button className="btn btn-ghost" onClick={onRestart}><RotateCcw/> Restart scenario</button><button className="btn btn-dark" onClick={onHarder}><Target/> Try a harder level</button></div>
  </div></div>;
}
