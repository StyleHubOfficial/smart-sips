import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Shield, BookOpen, GraduationCap, RotateCcw, Save, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { role } = useAuthStore();
  const { resetApp } = useAppStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [name, setName] = useState(() => localStorage.getItem('sunrise_profile_name') || 'Student User');
  const [className, setClassName] = useState(() => localStorage.getItem('sunrise_profile_class') || 'Class 10');
  const [subject, setSubject] = useState(() => localStorage.getItem('sunrise_profile_subject') || 'All Subjects');
  const [badge, setBadge] = useState(() => localStorage.getItem('sunrise_profile_badge') || 'Beginner');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sunrise_profile_name', name);
    localStorage.setItem('sunrise_profile_class', className);
    localStorage.setItem('sunrise_profile_subject', subject);
    localStorage.setItem('sunrise_profile_badge', badge);
    
    setIsSaved(true);
    addNotification('success', 'Profile updated successfully');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the app? This will clear all local data including chat history.')) {
      resetApp();
      addNotification('info', 'App has been reset');
      onClose();
    }
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

            <div className="mb-8 relative z-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] p-1 mb-4 relative group">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-white/50" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 rounded-full p-1.5 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#00F0FF]" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-white">{name}</h2>
              <p className="text-[#00F0FF] text-sm font-medium">{role.toUpperCase()}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Class
                  </label>
                  <input 
                    type="text" 
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Subject
                  </label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Badge
                </label>
                <select 
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                  <option value="Master">Master</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset App
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-[#00F0FF] to-[#B026FF] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaved ? 'Saved!' : 'Save Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
