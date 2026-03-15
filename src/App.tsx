import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Manage from "./pages/Manage";
import Analytics from "./pages/Analytics";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Notifications from "./components/Notifications";
import LoginModal from "./components/LoginModal";
import AIHelper from "./components/AIHelper";
import GlobalUploadProgress from "./components/GlobalUploadProgress";
import { useState, useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { useThemeStore } from "./store/useThemeStore";

import Practice from "./pages/Practice";
import Simulator from "./pages/Simulator";
import FlowChart from "./pages/FlowChart";
import ConceptVisualizer from "./pages/ConceptVisualizer";
import AIDeveloperPanel from "./pages/AIDeveloperPanel";
import PYQEngine from "./pages/PYQEngine";
import Tutorial from "./components/Tutorial";
import { IntroSequence } from "./components/IntroSequence";
import DeveloperCredit from "./components/DeveloperCredit";

export default function App() {
  const [isSmartPanelMode, setIsSmartPanelMode] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(true);
  const [showDeveloperCredit, setShowDeveloperCredit] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { isSimpleMode } = useAppStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "smart@sunrise" || accessCode === "ss123") {
      setIsUnlocked(true);
      localStorage.setItem('sunrise_unlocked', 'true');
    } else {
      alert("Invalid Access Code");
    }
  };

  return (
    <MotionConfig reducedMotion={isSimpleMode ? "always" : "never"}>
      {showEntryAnimation && <IntroSequence onComplete={() => {
        setShowEntryAnimation(false);
        setShowDeveloperCredit(true);
      }} />}
      {showDeveloperCredit && <DeveloperCredit onComplete={() => setShowDeveloperCredit(false)} />}
      <BrowserRouter>
        <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text)] relative overflow-hidden ${isSmartPanelMode ? 'text-lg' : ''}`}>
          {/* Animated background grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
          
          {/* Subtle glowing dots */}
          {!isSimpleMode && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#B026FF] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
            </>
          )}

          <div className="relative z-10 flex flex-col h-screen">
            <Header 
              isSmartPanelMode={isSmartPanelMode} 
              setIsSmartPanelMode={setIsSmartPanelMode}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              isNotificationsOpen={isNotificationsOpen}
              setIsNotificationsOpen={setIsNotificationsOpen}
            />
            
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard isSmartPanelMode={isSmartPanelMode} />} />
                  <Route path="/upload" element={<Upload onOpenLogin={() => setIsLoginModalOpen(true)} />} />
                  <Route path="/manage" element={<Manage />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/pyq" element={<PYQEngine />} />
                  <Route path="/simulator" element={<Simulator />} />
                  <Route path="/flowchart" element={<FlowChart />} />
                  <Route path="/visualizer" element={<ConceptVisualizer />} />
                  <Route path="/ai-developer" element={<AIDeveloperPanel />} />
                </Routes>
              </AnimatePresence>
            </main>

            <Navigation />
            <Notifications isOpen={isNotificationsOpen} />
            <AIHelper />
            <GlobalUploadProgress />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            <Tutorial />
          </div>
        </div>
      </BrowserRouter>
    </MotionConfig>
  );
}
