"use client";
import * as Icons from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { useState } from "react";

const categories = [
  "Food & Shopping",
  "Travel & Daily Life",
  "Work & Professional"
];

export default function ScenarioGrid({ onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCategories = expanded ? categories : categories.slice(0, 1);

  return (
    <>
      <div className="scenario-groups">
        {visibleCategories.map((category) => (
          <section className="scenario-group" key={category}>
            <h3 className="scenario-category">{category}</h3>
            <div className="scenario-grid">
              {scenarios.filter((scenario) => scenario.category === category).map((s) => {
                const index = scenarios.findIndex((scenario) => scenario.id === s.id);
                const Icon = Icons[s.icon] || Icons.MessageCircle;
                return <article className="scenario-card" key={s.id}>
                  <div className="scenario-head"><span className={`scenario-icon tone-${index % 4}`}><Icon /></span><div className="level-chips"><span>Beginner</span></div></div>
                  <div><small className="jp-title">{s.jp}</small><h3>{s.name}</h3><p>{s.description}</p></div>
                  <div className="scenario-role"><span>YOU'LL TALK TO</span><b>{s.role}</b><i>·</i><span>{s.estimatedTime}</span></div>
                  <div className="phrase-preview"><span>TRY SAYING</span><b>{s.usefulPhrases[1] || s.usefulPhrases[0]}</b></div>
                  <button onClick={() => onSelect(s)}>Start conversation <span>→</span></button>
                </article>;
              })}
            </div>
          </section>
        ))}
      </div>
      <button className="btn btn-ghost show-more" onClick={() => setExpanded(!expanded)}>{expanded ? "Show fewer scenarios" : "Explore all 12 scenarios"} <span>{expanded ? "↑" : "↓"}</span></button>
    </>
  );
}
