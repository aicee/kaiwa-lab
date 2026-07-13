"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ view, onHome, onNavigate, onPractice }) {
  const [open, setOpen] = useState(false);
  const links = [["Scenarios", "#scenarios"], ["Demo", "#demo"]];
  return (
    <header className="nav-wrap">
      <nav className="nav shell">
        <button className="brand" onClick={onHome}><span className="brand-mark">話</span><span>Kaiwa <b>Lab</b></span></button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {view === "home" && links.map(([label, target]) => <button key={label} onClick={() => { onNavigate(target); setOpen(false); }}>{label}</button>)}
          <button className="btn btn-dark nav-cta" onClick={onPractice}>Start conversation <span>→</span></button>
        </div>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </nav>
    </header>
  );
}
