import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User, X, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { signInWithGoogle } from "../lib/authFunctions";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      addNotification('success', 'Logged in with Google successfully');
      onClose();
    } catch (err: any) {
      addNotification('error', err.message || 'Google Login Failed');
    }
    setLoading(false);
  }

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
              <h2 className="text-2xl font-display font-bold text-white mb-2">Login to Platform</h2>
              <p className="text-gray-400 text-sm">Authenticate your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">User / Teacher ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    value={id}
                    onChange={(e) => setId(e.target.value)}
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
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    placeholder="Enter Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 rounded-xl font-display font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
              
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="px-3 text-xs text-gray-500">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Sign in with Google
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
