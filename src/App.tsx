import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowUp, Zap } from "lucide-react";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import QuestionsArena from "./pages/QuestionsArena";
import AIGenerators from "./pages/AIGenerators";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Notifications from "./components/Notifications";
import LoginModal from "./components/LoginModal";
import AIHelper from "./components/AIHelper";
import GlobalUploadProgress from "./components/GlobalUploadProgress";
import { useState, useEffect, useRef } from "react";
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
import { PageTransition } from "./components/PageTransition";
import AutoSuggestModal from "./components/AutoSuggestModal";

function AppContent({ 
  isSmartPanelMode, 
  setIsSmartPanelMode, 
  isLoginModalOpen, 
  setIsLoginModalOpen, 
  isNotificationsOpen, 
  setIsNotificationsOpen,
  isRevealing
}: any) {
  const location = useLocation();
  const { isGlowEnabled } = useAppStore();
  const mainRef = useRef<HTMLElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current) {
        setShowBackToTop(mainRef.current.scrollTop > 300);
      }
    };
    const currentMain = mainRef.current;
    if (currentMain) {
      currentMain.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentMain) {
        currentMain.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text)] relative overflow-hidden ${isSmartPanelMode ? 'text-lg' : ''} ${isGlowEnabled ? 'glow-enabled' : ''}`}>
      {/* Animated background grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      {/* Subtle glowing dots */}
      {isGlowEnabled && (
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
          isRevealing={isRevealing}
          containerRef={mainRef}
        />
        
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/courses" element={<PageTransition><Courses /></PageTransition>} />
              <Route path="/questions" element={<PageTransition><QuestionsArena /></PageTransition>} />
              <Route path="/ai-generators" element={<PageTransition><AIGenerators /></PageTransition>} />
              <Route path="/upload" element={<PageTransition><Upload onOpenLogin={() => setIsLoginModalOpen(true)} /></PageTransition>} />
              <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
              <Route path="/practice" element={<PageTransition><Practice /></PageTransition>} />
              <Route path="/pyq" element={<PageTransition><PYQEngine /></PageTransition>} />
              <Route path="/simulator" element={<PageTransition><Simulator /></PageTransition>} />
              <Route path="/flowchart" element={<PageTransition><FlowChart /></PageTransition>} />
              <Route path="/visualizer" element={<PageTransition><ConceptVisualizer /></PageTransition>} />
              <Route path="/ai-developer" element={<PageTransition><AIDeveloperPanel /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </main>

        <Navigation />
        <Notifications isOpen={isNotificationsOpen} />
        <AIHelper />
        <GlobalUploadProgress />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        <Tutorial />
        <AutoSuggestModal />

        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-24 right-6 p-3 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:bg-[#00F0FF]/30 transition-colors z-40 backdrop-blur-md"
              title="Back to Top"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [isSmartPanelMode, setIsSmartPanelMode] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(() => {
    const isPermanentlySkipped = localStorage.getItem('sunrise_skip_intro') === 'true';
    return !isPermanentlySkipped;
  });
  const [showDeveloperCredit, setShowDeveloperCredit] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('sunrise_unlocked_v6') === 'true';
  });
  const [accessCode, setAccessCode] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { isGlowEnabled } = useAppStore();
  const { theme } = useThemeStore();
  const [isRevealed, setIsRevealed] = useState(() => {
    const isPermanentlySkipped = localStorage.getItem('sunrise_skip_intro') === 'true';
    return isPermanentlySkipped;
  });

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
      localStorage.setItem('sunrise_unlocked_v6', 'true');
    } else {
      alert("Invalid Access Code");
    }
  };

  const handleIntroComplete = (skipped?: boolean) => {
    setShowEntryAnimation(false);
    setTimeout(() => {
      setIsRevealed(true);
    }, 400);
    
    if (!skipped) {
      setShowDeveloperCredit(true);
    }
  };

  return (
    <MotionConfig reducedMotion={isGlowEnabled ? "never" : "always"}>
      <AnimatePresence>
        {showEntryAnimation && <IntroSequence key="intro" onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <AnimatePresence>
        {showDeveloperCredit && <DeveloperCredit key="credit" onComplete={() => setShowDeveloperCredit(false)} />}
      </AnimatePresence>
      
      <motion.div
        initial={showEntryAnimation ? { clipPath: 'circle(0% at 0% 100%)' } : { clipPath: 'circle(150% at 0% 100%)' }}
        animate={isRevealed ? { clipPath: 'circle(150% at 0% 100%)' } : {}}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10"
      >
        {isUnlocked && (
          <BrowserRouter>
            <AppContent 
              isSmartPanelMode={isSmartPanelMode}
              setIsSmartPanelMode={setIsSmartPanelMode}
              isLoginModalOpen={isLoginModalOpen}
              setIsLoginModalOpen={setIsLoginModalOpen}
              isNotificationsOpen={isNotificationsOpen}
              setIsNotificationsOpen={setIsNotificationsOpen}
              isRevealing={false}
            />
          </BrowserRouter>
        )}
      </motion.div>
      {!isUnlocked && (
        <div className="fixed inset-0 z-[10000] bg-[#0a0a0a] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#00F0FF10_0%,transparent_70%)]"></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-md relative z-10 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#B026FF] p-[1px] mx-auto mb-6">
              <div className="w-full h-full bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-[#00F0FF]" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 mb-8 text-sm">Please enter the website access code to continue.</p>
            
            <form onSubmit={handleUnlock} className="space-y-4">
              <input 
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter Access Code"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white text-center focus:outline-none focus:border-[#00F0FF]/50 transition-all"
                autoFocus
              />
              <button 
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
              >
                Unlock Platform
              </button>
            </form>
            <p className="mt-6 text-[10px] text-gray-500 uppercase tracking-widest">Smart Sunrise v3.0 Security</p>
          </motion.div>
        </div>
      )}
    </MotionConfig>
  );
}
