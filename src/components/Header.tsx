import { useState, useEffect } from "react";
import { Monitor, Maximize, Moon, Sun, Clock, LogIn, LogOut, Zap, User, Bell } from "lucide-react";
import { format } from "date-fns";
import { motion, useScroll, useSpring } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useThemeStore } from "../store/useThemeStore";
import { useAppStore } from "../store/useAppStore";

interface HeaderProps {
  isSmartPanelMode: boolean;
  setIsSmartPanelMode: (mode: boolean) => void;
  onOpenLogin: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isRevealing?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export default function Header({ 
  isSmartPanelMode, 
  setIsSmartPanelMode, 
  onOpenLogin, 
  isNotificationsOpen, 
  setIsNotificationsOpen, 
  isRevealing,
  containerRef
}: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAuthenticated, logout } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { theme, toggleTheme } = useThemeStore();
  const { isGlowEnabled, toggleGlow, notifications } = useAppStore();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [logo, setLogo] = useState<string | null>("https://res.cloudinary.com/de4qwrmmw/image/upload/v1774792677/5a3b278a-9094-49bb-bb22-e0e59619f49e-copied-media_2_b1hkap.png");
  const [siteName, setSiteName] = useState('Smart Sunrise');

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.websiteName) setSiteName(data.websiteName);
        if (data.logoUrl) setLogo(data.logoUrl);
      })
      .catch(err => console.error('Failed to load settings:', err));
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('settings-updated', fetchSettings);
    return () => window.removeEventListener('settings-updated', fetchSettings);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <>
      {!isRevealing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00F0FF] origin-left z-[60]"
          style={{ scaleX }}
        />
      )}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5"
      >
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <div className="w-full h-full bg-[#0E0E12] rounded-full flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                    onError={() => setLogo(null)}
                  />
                ) : (
                  <Monitor className="w-6 h-6 text-[#00F0FF]" />
                )}
              </div>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight hidden sm:block">
              {siteName}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 text-[#00FFFF]" />
          <span className="font-mono text-sm tracking-widest text-[var(--color-text-muted)]">
            {format(time, "eeee, MMMM do, yyyy • hh:mm:ss a")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative group">
              <button 
                onClick={() => {
                  logout();
                  addNotification('info', 'Logged out successfully');
                }}
                className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:block">Logout</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            </div>
          ) : (
            <div className="relative group">
              <button 
                onClick={onOpenLogin}
                className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-all duration-300 flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:block">Login</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Login
              </div>
            </div>
          )}

          <div className="relative group">
            <button 
              onClick={() => setIsSmartPanelMode(!isSmartPanelMode)}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isSmartPanelMode ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
            >
              <Monitor className="w-5 h-5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Smart Panel Mode
            </div>
          </div>
          
          <div className="relative group">
            <button 
              onClick={toggleGlow}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isGlowEnabled ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
            >
              <Zap className={`w-5 h-5 ${isGlowEnabled ? 'fill-current animate-pulse' : ''}`} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {isGlowEnabled ? 'Disable Glow Effects' : 'Enable Glow Effects'}
            </div>
          </div>

          <div className="relative group hidden sm:block">
            <button 
              onClick={handleFullscreen}
              className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-all duration-300"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Toggle Fullscreen
            </div>
          </div>
          
          <div className="relative group">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-all duration-300"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Toggle Theme
            </div>
          </div>
        </div>
      </div>
    </motion.header>
    </>
  );
}
