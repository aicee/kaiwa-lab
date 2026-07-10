"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LandingPage from "@/components/LandingPage";
import PracticeSetup from "@/components/PracticeSetup";
import ConversationRoom from "@/components/ConversationRoom";
import FeedbackReport from "@/components/FeedbackReport";
import Footer from "@/components/Footer";
import { scenarios } from "@/data/scenarios";
import { mockFeedback } from "@/data/mockFeedback";
import { generateSessionFeedback } from "@/lib/apiPlaceholders";
import { clearStoredDemoAccessToken, hasStoredDemoAccessToken, storeDemoAccessToken } from "@/lib/clientDemoAccess";

export default function Home() {
  const [view, setView] = useState("home");
  const [scenario, setScenario] = useState(scenarios[0]);
  const [settings, setSettings] = useState({
    level: "N5 Beginner",
    mode: "Demo Mode",
    politeness: "Polite",
    romaji: true,
    translation: true
  });
  const [feedback, setFeedback] = useState(mockFeedback);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showDemoCodeModal, setShowDemoCodeModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  useEffect(() => {
    setVoiceUnlocked(hasStoredDemoAccessToken());
  }, []);

  const chooseScenario = (item) => {
    setScenario(item);
    setView("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = (anchor) => {
    setView("home");
    setTimeout(() => document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  return (
    <>
      {(view === "home" || view === "setup") && <Navbar view={view} onHome={() => goHome("#top")} onNavigate={goHome} onPractice={() => chooseScenario(scenarios[0])} />}
      <main>
        {view === "home" && <LandingPage onSelect={chooseScenario} onDemo={() => chooseScenario(scenarios[0])} />}
        {view === "setup" && (
          <PracticeSetup
            scenario={scenario}
            settings={settings}
            setSettings={setSettings}
            onBack={() => goHome("#scenarios")}
            onStart={() => {
              if (settings.mode === "Voice Mode" && !voiceUnlocked) {
                setShowDemoCodeModal(true);
                return;
              }
              setView("conversation");
            }}
            voiceUnlocked={voiceUnlocked}
            unlockMessage={unlockMessage}
            unlockError={unlockError}
            unlocking={unlocking}
            showDemoCodeModal={showDemoCodeModal}
            setShowDemoCodeModal={setShowDemoCodeModal}
            onContinueDemo={() => {
              setSettings((s) => ({ ...s, mode: "Demo Mode" }));
              setUnlockError("");
              setShowDemoCodeModal(false);
            }}
            onUnlockVoice={async (event) => {
              event.preventDefault();
              setUnlocking(true);
              setUnlockError("");
              setUnlockMessage("");
              const code = new FormData(event.currentTarget).get("demoCode");

              try {
                const response = await fetch("/api/demo-code/validate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code })
                });
                const data = await response.json();

                if (!data.success || !data.accessToken) {
                  setUnlockError("That code did not work. You can still use Demo Mode.");
                  return;
                }

                storeDemoAccessToken(data.accessToken);
                setVoiceUnlocked(true);
                setSettings((s) => ({ ...s, mode: "Voice Mode" }));
                setUnlockMessage("Voice Mode unlocked for this session.");
                setShowDemoCodeModal(false);
              } catch {
                setUnlockError("That code did not work. You can still use Demo Mode.");
              } finally {
                setUnlocking(false);
              }
            }}
          />
        )}
        {view === "conversation" && (
          <ConversationRoom
            scenario={scenario}
            settings={settings}
            onEnd={async (sessionData) => {
              try {
                setFeedback(await generateSessionFeedback(sessionData));
              } catch (error) {
                console.warn("Feedback request failed; using demo feedback.", error);
                setFeedback(mockFeedback);
              } finally {
                setView("feedback");
              }
            }}
            onVoiceAccessExpired={() => {
              clearStoredDemoAccessToken();
              setVoiceUnlocked(false);
              setUnlockError("Please enter the demo code again to use Voice Mode.");
              setUnlockMessage("");
              setSettings((s) => ({ ...s, mode: "Voice Mode" }));
              setView("setup");
              setShowDemoCodeModal(true);
            }}
          />
        )}
        {view === "feedback" && (
          <FeedbackReport
            scenario={scenario}
            settings={settings}
            feedback={feedback}
            onRestart={() => setView("conversation")}
            onHarder={() => {
              setSettings((s) => ({ ...s, level: s.level === "N5 Beginner" ? "N3 Intermediate" : "N1 Advanced" }));
              setView("setup");
            }}
            onNext={() => chooseScenario(scenarios.find((s) => s.id === scenario.next) || scenarios[1])}
          />
        )}
      </main>
      {view === "home" && <Footer />}
    </>
  );
}
