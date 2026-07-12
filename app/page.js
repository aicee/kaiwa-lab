"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import LandingPage from "@/components/LandingPage";
import PracticeSetup from "@/components/PracticeSetup";
import ConversationRoom from "@/components/ConversationRoom";
import FeedbackReport from "@/components/FeedbackReport";
import Footer from "@/components/Footer";
import { scenarios } from "@/data/scenarios";
import { mockFeedback } from "@/data/mockFeedback";
import { generateSessionFeedback } from "@/lib/apiPlaceholders";
import {
  DEMO_PRACTICE_MODE,
  VOICE_PRACTICE_MODE,
  createDefaultPracticeSettings,
  getSupportLevel
} from "@/lib/practiceSettings";
import {
  clearStoredDemoAccessHint,
  hasStoredDemoAccessHint,
  refreshDemoAccessHint,
  storeDemoAccessHint
} from "@/lib/clientDemoAccess";

export default function Home() {
  const [view, setView] = useState("home");
  const [scenario, setScenario] = useState(scenarios[0]);
  const [settings, setSettings] = useState(createDefaultPracticeSettings);
  const [feedback, setFeedback] = useState(mockFeedback);
  const [sessionResult, setSessionResult] = useState(null);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showDemoCodeModal, setShowDemoCodeModal] = useState(false);
  const checkingVoiceAccessRef = useRef(false);
  const feedbackRequestKeysRef = useRef(new Set());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    setVoiceUnlocked(hasStoredDemoAccessHint());

    refreshDemoAccessHint()
      .then((unlocked) => {
        if (!cancelled) setVoiceUnlocked(unlocked);
      })
      .catch(() => {
        clearStoredDemoAccessHint();
        if (!cancelled) setVoiceUnlocked(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const requireVoiceAccess = async () => {
    if (checkingVoiceAccessRef.current) return false;
    checkingVoiceAccessRef.current = true;

    try {
      const unlocked = await refreshDemoAccessHint();
      setVoiceUnlocked(unlocked);
      if (!unlocked) {
        setUnlockMessage("");
        setUnlockError("Your demo access expired. Enter the demo code again to continue.");
        setShowDemoCodeModal(true);
      }
      return unlocked;
    } catch {
      clearStoredDemoAccessHint();
      setVoiceUnlocked(false);
      setUnlockMessage("");
      setUnlockError("Your demo access expired. Enter the demo code again to continue.");
      setShowDemoCodeModal(true);
      return false;
    } finally {
      checkingVoiceAccessRef.current = false;
    }
  };

  const chooseScenario = (item) => {
    setScenario(item);
    setSettings((current) => ({
      ...current,
      mode: VOICE_PRACTICE_MODE,
      politeness: item.politenessMode || current.politeness
    }));
    setView("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startDemoFlow = () => {
    setScenario(scenarios[0]);
    setSettings((current) => ({
      ...current,
      mode: DEMO_PRACTICE_MODE,
      politeness: scenarios[0].politenessMode || current.politeness
    }));
    setSessionResult(null);
    setFeedback(mockFeedback);
    setView("conversation");
  };

  const goHome = (anchor) => {
    setView("home");
    setTimeout(() => document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  return (
    <>
      {(view === "home" || view === "setup") && <Navbar view={view} onHome={() => goHome("#top")} onNavigate={goHome} onPractice={() => chooseScenario(scenarios[0])} />}
      <main>
        {view === "home" && <LandingPage onSelect={chooseScenario} onDemo={startDemoFlow} />}
        {view === "setup" && (
          <PracticeSetup
            scenario={scenario}
            settings={settings}
            setSettings={setSettings}
            onBack={() => goHome("#scenarios")}
            onStart={async () => {
              const unlocked = await requireVoiceAccess();
              if (!unlocked) {
                return;
              }
              setSettings((s) => ({ ...s, mode: VOICE_PRACTICE_MODE, politeness: scenario.politenessMode || s.politeness }));
              setView("conversation");
            }}
            voiceUnlocked={voiceUnlocked}
            unlockMessage={unlockMessage}
            unlockError={unlockError}
            unlocking={unlocking}
            showDemoCodeModal={showDemoCodeModal}
            setShowDemoCodeModal={setShowDemoCodeModal}
            onContinueDemo={() => {
              setSettings((s) => ({ ...s, mode: DEMO_PRACTICE_MODE, politeness: scenario.politenessMode || s.politeness }));
              setUnlockError("");
              setShowDemoCodeModal(false);
              setView("conversation");
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
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code })
                });
                const data = await response.json();

                if (!data.success || !data.unlocked) {
                  setUnlockError("That code did not work. You can still view the demo flow.");
                  return;
                }

                storeDemoAccessHint();
                setVoiceUnlocked(true);
                setSettings((s) => ({ ...s, mode: VOICE_PRACTICE_MODE, politeness: scenario.politenessMode || s.politeness }));
                setUnlockMessage("Voice practice unlocked for this session.");
                setShowDemoCodeModal(false);
                setView("conversation");
              } catch {
                setUnlockError("That code did not work. You can still view the demo flow.");
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
              setSessionResult(sessionData);
              if (sessionData?.practiceMode !== VOICE_PRACTICE_MODE) {
                setFeedback(mockFeedback);
                setView("feedback");
                return;
              }

              const completedSessionKey = sessionData.conversationId || `${sessionData.scenario?.id || "scenario"}:${sessionData.endedAt || "ended"}:${sessionData.transcript?.length || 0}`;
              if (feedbackRequestKeysRef.current.has(completedSessionKey)) {
                setView("feedback");
                return;
              }

              feedbackRequestKeysRef.current.add(completedSessionKey);
              try {
                setFeedback(await generateSessionFeedback(sessionData));
              } catch (error) {
                console.warn("Feedback request failed; using sample feedback.", error);
                setFeedback({
                  ...mockFeedback,
                  source: "sample",
                  message: "We couldn't generate live feedback, so here's a sample report."
                });
              }
              setView("feedback");
            }}
            onVoiceAccessExpired={() => {
              clearStoredDemoAccessHint();
              setVoiceUnlocked(false);
              setUnlockError("Your demo access expired. Enter the demo code again to continue.");
              setUnlockMessage("");
              setSettings((s) => ({ ...s, mode: VOICE_PRACTICE_MODE, politeness: scenario.politenessMode || s.politeness }));
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
            sessionResult={sessionResult}
            onRestart={() => setView("conversation")}
            onHarder={() => {
              setSettings((s) => {
                const nextValue = s.supportLevel === "guided" ? "natural" : "challenge";
                const support = getSupportLevel(nextValue);
                return {
                  ...s,
                  supportLevel: support.value,
                  supportLevelLabel: support.label,
                  romaji: support.romaji,
                  translation: support.translation
                };
              });
              setView("setup");
            }}
            onNext={(scenarioId) => chooseScenario(scenarios.find((s) => s.id === scenarioId) || scenarios.find((s) => s.id === scenario.next) || scenarios[1])}
          />
        )}
      </main>
      {view === "home" && <Footer />}
    </>
  );
}
