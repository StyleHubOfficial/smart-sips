import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowUp, Zap } from "lucide-react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useAppStore } from "./store/useAppStore";
import { useThemeStore } from "./store/useThemeStore";

import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Notifications from "./components/Notifications";
import LoginModal from "./components/LoginModal";
import AIHelper from "./components/AIHelper";
import GlobalUploadProgress from "./components/GlobalUploadProgress";
import Tutorial from "./components/Tutorial";
import { IntroSequence } from "./components/IntroSequence";
import DeveloperCredit from "./components/DeveloperCredit";
import { PageTransition } from "./components/PageTransition";
import AutoSuggestModal from "./components/AutoSuggestModal";

import { usePracticeStore } from "./store/usePracticeStore";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Courses = lazy(() => import("./pages/Courses"));
const QuestionsArena = lazy(() => import("./pages/QuestionsArena"));
const AIGenerators = lazy(() => import("./pages/AIGenerators"));
const Upload = lazy(() => import("./pages/Upload"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Practice = lazy(() => import("./pages/Practice"));
const Simulator = lazy(() => import("./pages/Simulator"));
const FlowChart = lazy(() => import("./pages/FlowChart"));
const ConceptVisualizer = lazy(() => import("./pages/ConceptVisualizer"));
const AIDeveloperPanel = lazy(() => import("./pages/AIDeveloperPanel"));
const Teacher = lazy(() => import("./pages/Teacher"));
const PYQEngine = lazy(() => import("./pages/PYQEngine"));

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
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text)] relative ${isSmartPanelMode ? 'text-lg' : ''} ${isGlowEnabled && !isSmartPanelMode ? 'glow-enabled' : ''}`}>
      {/* Animated background grid lines - disabled in smart panel mode */}
      {!isSmartPanelMode && (
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
      )}
      
      {/* Subtle glowing dots - disabled in smart panel mode */}
      {isGlowEnabled && !isSmartPanelMode && (
        <>
          <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse z-0"></div>
          <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#B026FF] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
        </>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          isSmartPanelMode={isSmartPanelMode} 
          setIsSmartPanelMode={setIsSmartPanelMode}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          isNotificationsOpen={isNotificationsOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
          isRevealing={isRevealing}
        />
        
        <main className="flex-1 relative">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#00F0FF]/20 border-t-[#00F0FF] rounded-full animate-spin"></div></div>}>
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
                <Route path="/teacher" element={<PageTransition><Teacher /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>

        <Navigation />
        <Notifications isOpen={isNotificationsOpen} />
        <AIHelper />
        <GlobalUploadProgress />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        {location.pathname === "/" && <Tutorial />}
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
  const { isSmartPanelMode, setIsSmartPanelMode } = usePracticeStore();
  const [showEntryAnimation, setShowEntryAnimation] = useState(() => {
    const isPermanentlySkipped = localStorage.getItem('sunrise_skip_intro') === 'true';
    return !isPermanentlySkipped;
  });
  const [showDeveloperCredit, setShowDeveloperCredit] = useState(false);
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
    <MotionConfig reducedMotion={(!isGlowEnabled || isSmartPanelMode) ? "always" : "never"}>
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
      </motion.div>
    </MotionConfig>
  );
}
