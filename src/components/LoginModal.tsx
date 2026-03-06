import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User, X, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network request for effect
    setTimeout(() => {
      const success = login(id, password);
      if (success) {
        addNotification('success', 'Logged in successfully');
        onClose();
      } else {
        addNotification('error', 'Invalid credentials');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel rounded-3xl p-8 w-full max-w-md relative z-10 border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 to-[#B026FF]/10 pointer-events-none"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8 relative z-10">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 rounded-2xl flex items-center justify-center mb-4 border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Lock className="w-8 h-8 text-[#00F0FF]" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Teacher Login</h2>
              <p className="text-gray-400 text-sm">Authenticate to manage classroom content</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Teacher ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    placeholder="Enter ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    placeholder="Enter Password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 rounded-xl font-display font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
