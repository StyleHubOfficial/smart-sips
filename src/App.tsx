import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "motion/react";
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
import Tutorial from "./components/Tutorial";

export default function App() {
  const [isSmartPanelMode, setIsSmartPanelMode] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEntryAnimation(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showEntryAnimation) {
    return (
      <div className="fixed inset-0 bg-[var(--color-background)] flex items-center justify-center z-50">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] blur-[100px] opacity-30 animate-pulse"></div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 animate-fade-in-up">
            Smart Sunrise <span className="text-sm font-mono text-[#00F0FF] align-top ml-2">v2.0</span>
          </h1>
          <p className="text-center text-gray-500 text-xs mt-2 font-mono tracking-widest opacity-0 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            ADVANCED AI EDITION
          </p>
          <div className="h-[2px] w-0 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] mt-4 animate-expand-line mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={isSimpleMode ? "always" : "never"}>
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
                  <Route path="/simulator" element={<Simulator />} />
                  <Route path="/flowchart" element={<FlowChart />} />
                  <Route path="/visualizer" element={<ConceptVisualizer />} />
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
