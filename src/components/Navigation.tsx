import { NavLink } from "react-router-dom";
import { Home, BookOpen, BrainCircuit, Sparkles, Settings, BarChart3, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";

export default function Navigation() {
  const { role } = useAuthStore();

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto max-w-2xl"
    >
      <div className="glass-panel bg-[#0E0E12] sm:bg-[#0E0E12]/90 rounded-full px-4 sm:px-6 py-3 flex items-center justify-between sm:justify-center sm:gap-4 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-x-auto hide-scrollbar">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-[#00F0FF] scale-110 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
          title="Home"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">Home</span>
        </NavLink>
        
        <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>
        
        <NavLink 
          to="/courses" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-[#B026FF] scale-110 drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
          title="Courses"
        >
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">Courses</span>
        </NavLink>

        <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>

        <NavLink 
          to="/questions" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
          title="Questions Arena"
        >
          <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">Arena</span>
        </NavLink>

        <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>

        <NavLink 
          to="/ai-generators" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
          title="AI Generators"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">AI Gen</span>
        </NavLink>

        {(role === 'admin' || role === 'developer' || role === 'teacher') && (
          <>
            <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>
            <NavLink 
              to="/upload" 
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-[#B026FF] scale-110 drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-gray-400 hover:text-white'}`
              }
              title="Upload"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">Upload</span>
            </NavLink>
            <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>
          </>
        )}
        {(role === 'admin' || role === 'developer') && (
          <>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-green-400 scale-110 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-gray-400 hover:text-white'}`
              }
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">Stats</span>
            </NavLink>
            <div className="w-[1px] h-6 sm:h-8 bg-white/10 shrink-0"></div>
            <NavLink 
              to="/ai-developer" 
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 transition-all duration-300 min-w-[40px] ${isActive ? 'text-orange-400 scale-110 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' : 'text-gray-400 hover:text-white'}`
              }
              title="AI Developer"
            >
              <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">AI Dev</span>
            </NavLink>
          </>
        )}
      </div>
    </motion.nav>
  );
}
