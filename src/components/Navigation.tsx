import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, BrainCircuit, Sparkles, Settings, BarChart3, Terminal, Presentation } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";

export default function Navigation() {
  const { role } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: "/", id: "home", label: "Home", icon: Home, color: "#00F0FF" },
    { path: "/courses", id: "courses", label: "Courses", icon: BookOpen, color: "#B026FF" },
    { path: "/questions", id: "arena", label: "Arena", icon: BrainCircuit, color: "#facc15" },
    { path: "/ai-generators", id: "ai", label: "AI Gen", icon: Sparkles, color: "#34d399" },
    { path: "/teacher", id: "teacher", label: "SBoard", icon: Presentation, color: "#818cf8", hasDot: true },
  ];

  if (role === 'admin' || role === 'developer' || role === 'teacher') {
    navItems.push({ path: "/upload", id: "upload", label: "Upload", icon: Settings, color: "#ec4899" });
  }

  if (role === 'admin' || role === 'developer') {
    navItems.push({ path: "/analytics", id: "analytics", label: "Stats", icon: BarChart3, color: "#4ade80" });
    navItems.push({ path: "/ai-developer", id: "dev", label: "Dev", icon: Terminal, color: "#fb923c" });
  }

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto overflow-visible select-none"
    >
      <div className="bg-[#0e0e12] sm:bg-[#0e0e12]/90 rounded-[2.5rem] p-2 flex items-center justify-between sm:justify-center gap-1 sm:gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5 overflow-x-auto hide-scrollbar touch-pan-x">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink 
              key={item.id}
              to={item.path} 
              className="relative flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-2 px-1 transition-colors duration-300 group outline-none"
              title={item.label}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bubble"
                  className="absolute inset-0 bg-white/10 rounded-2xl sm:rounded-[1.5rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <motion.div 
                whileTap={{ scale: 0.85 }}
                className={`relative z-10 p-1 mb-1 transform transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`} 
                style={{ color: isActive ? item.color : '#9ca3af' }}
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {item.hasDot && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current shadow-[0_0_5px_currentColor]"></span>
                  </span>
                )}
              </motion.div>
              
              <span 
                className={`relative z-10 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}
