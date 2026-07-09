"use client";
import * as Icons from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { useState } from "react";

const categories = [
  { name: "Food & Shopping", ids: ["ramen", "cafe", "store", "reservation", "allergies", "clothes"] },
  { name: "Travel & Daily Life", ids: ["hotel", "train", "clinic", "neighbor"] },
  { name: "Work & Professional", ids: ["workplace", "interview"] }
];

export default function ScenarioGrid({ onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCategories = expanded ? categories : categories.slice(0, 1);

  return (
    <>
      <div className="scenario-groups">
        {visibleCategories.map((category) => (
          <section className="scenario-group" key={category.name}>
            <h3 className="scenario-category">{category.name}</h3>
            <div className="scenario-grid">
              {category.ids.map((id) => {
                const s = scenarios.find((scenario) => scenario.id === id);
                const index = scenarios.findIndex((scenario) => scenario.id === id);
                const Icon = Icons[s.icon] || Icons.MessageCircle;
                return <article className="scenario-card" key={s.id}>
                  <div className="scenario-head"><span className={`scenario-icon tone-${index % 4}`}><Icon /></span><div className="level-chips">{s.levels.map(x => <span key={x}>{x}</span>)}</div></div>
                  <div><small className="jp-title">{s.jp}</small><h3>{s.title}</h3><p>{s.description}</p></div>
                  <div className="scenario-role"><span>AI ROLE</span><b>{s.role}</b><i>·</i><span>{s.time}</span></div>
                  <div className="phrase-preview"><span>TRY SAYING</span><b>{s.phrases[1] || s.phrases[0]}</b></div>
                  <button onClick={() => onSelect(s)}>Start scenario <span>→</span></button>
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
