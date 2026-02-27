import { useState, useEffect } from "react";
import { Monitor, Maximize, Moon, Sun, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";

interface HeaderProps {
  isSmartPanelMode: boolean;
  setIsSmartPanelMode: (mode: boolean) => void;
}

export default function Header({ isSmartPanelMode, setIsSmartPanelMode }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
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
              <div className="w-full h-full bg-[#0E0E12] rounded-xl flex items-center justify-center">
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
          <span className="font-mono text-sm tracking-widest text-gray-300">
            {format(time, "HH:mm:ss")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSmartPanelMode(!isSmartPanelMode)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${isSmartPanelMode ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            title="Smart Panel Mode"
          >
            <Monitor className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-300 hidden sm:block"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
