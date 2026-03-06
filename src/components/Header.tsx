import { useState, useEffect } from "react";
import { Monitor, Maximize, Moon, Sun, Clock, LogIn, LogOut, Zap, User, Bell, X } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useTheme } from "../context/ThemeContext";
import { useAppStore } from "../store/useAppStore";

interface HeaderProps {
  isSmartPanelMode: boolean;
  setIsSmartPanelMode: (mode: boolean) => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
}

export default function Header({ isSmartPanelMode, setIsSmartPanelMode, onOpenLogin, onOpenProfile }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAuthenticated, logout } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { theme, toggleTheme } = useTheme();
  const { isSimpleMode, toggleSimpleMode, notifications: siteNotifications, deleteSiteNotification } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0E0E12] p-[1px]">
              <div className="w-full h-full bg-[var(--color-background)] rounded-xl flex items-center justify-center">
                <Monitor className="w-5 h-5 text-[#00F0FF]" />
              </div>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight hidden sm:block">
              Sunrise <span className="text-gradient">Panel</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 text-[#00FFFF]" />
          <span className="font-mono text-sm tracking-widest text-[var(--color-text-muted)]">
            {format(time, "HH:mm:ss")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <button 
                onClick={onOpenProfile}
                className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-all duration-300 flex items-center gap-2"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  logout();
                  addNotification('info', 'Logged out successfully');
                }}
                className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 flex items-center gap-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <button 
              onClick={onOpenLogin}
              className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-all duration-300 flex items-center gap-2"
              title="Login"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">Login</span>
            </button>
          )}

          <button 
            onClick={() => setIsSmartPanelMode(!isSmartPanelMode)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${isSmartPanelMode ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
            title="Smart Panel Mode"
          >
            <Monitor className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleSimpleMode}
            className={`p-2.5 rounded-xl transition-all duration-300 ${isSimpleMode ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'}`}
            title="Simple UI Mode"
          >
            <Zap className="w-5 h-5" />
          </button>

          <button 
            onClick={handleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-all duration-300 hidden sm:block"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-all duration-300"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-all duration-300 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {siteNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--color-background)]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 z-50">
                <h3 className="text-lg font-display font-bold mb-3">Announcements</h3>
                {siteNotifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No new announcements</p>
                ) : (
                  <div className="space-y-3">
                    {siteNotifications.map(notif => (
                      <div key={notif.id} className="p-3 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => deleteSiteNotification(notif.id)}
                          className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-[#00F0FF] font-medium mb-1">{notif.title}</p>
                        <p className="text-sm text-gray-300">{notif.message}</p>
                        <p className="text-[10px] text-gray-500 mt-2">{format(new Date(notif.timestamp), 'MMM d, h:mm a')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
