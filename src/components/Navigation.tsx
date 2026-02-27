import { NavLink } from "react-router-dom";
import { LayoutDashboard, UploadCloud } from "lucide-react";
import { motion } from "motion/react";

export default function Navigation() {
  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#00F0FF] scale-110 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Dashboard</span>
        </NavLink>
        
        <div className="w-[1px] h-8 bg-white/10"></div>
        
        <NavLink 
          to="/upload" 
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#B026FF] scale-110 drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-gray-400 hover:text-white'}`
          }
        >
          <UploadCloud className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
        </NavLink>
      </div>
    </motion.nav>
  );
}
