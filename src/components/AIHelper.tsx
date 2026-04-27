import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Image as ImageIcon, Zap, ArrowRight, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuthStore } from '../store/useAuthStore';
import ReactMarkdown from 'react-markdown';

export default function AIHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, actions?: { label: string, url?: string, command?: string }[] }[]>(() => {
    const saved = localStorage.getItem('sunrise_ai_chat');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: 'Hello! I am your Sunrise AI Assistant. How can I help you today?' }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemma-2-2b-it');
  const [wallpaper, setWallpaper] = useState<'default' | 'bubbles' | 'stars' | 'neon' | 'skeleton'>('default');
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  
  const bubblesData = useMemo(() => Array.from({ length: 20 }).map(() => ({
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 2,
    size: Math.random() * 40 + 10
  })), []);

  const starsData = useMemo(() => Array.from({ length: 120 }).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 0.8 + Math.random() * 1.5,
    delay: Math.random() * 3,
    size: Math.random() * 2.5 + 0.5
  })), []);

  const skeletonLines = useMemo(() => Array.from({ length: 10 }).map(() => ({
    top: `${Math.random() * 100}%`,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
    width: `${Math.random() * 40 + 20}%`
  })), []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { role } = useAuthStore();

  useEffect(() => {
    localStorage.setItem('sunrise_ai_chat', JSON.stringify(messages));
  }, [messages]);

  const handleNewChat = () => {
    setMessages([{ role: 'model', text: 'Hello! I am your Sunrise AI Assistant. How can I help you today?' }]);
    localStorage.removeItem('sunrise_ai_chat');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    setIsTyping(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are a helpful, professional AI assistant for 'Smart Sunrise' (Version 3.0), an educational platform.
      The user is currently logged in as a: ${role}.
      
      Formatting Guidelines:
      - Use **bold** for emphasis.
      - Use bullet points for lists.
      - Use code blocks for technical info.
      - Keep answers concise and friendly.
      
      Interactive Elements (CRITICAL):
      - If you suggest a platform tool or page, format it as: [Action: Label | /path]
      - If you suggest an external resource, format it as: [Link: Label | https://url]
      - Example: "You can check your courses here: [Action: View Courses | /courses]"
      
      User's message: ${userMsg}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
        });
      } catch (err: any) {
        if (err.message?.includes('API key') || err.message?.includes('not found') || selectedModel === 'gemma-2-2b-it') {
          console.warn("Model fallback triggered (Gemma -> Gemini Lite)", err);
          // Fallback if key doesn't have Gemma access yet
          response = await ai.models.generateContent({
             model: 'gemini-3.1-flash-lite-preview',
             contents: prompt,
          });
        } else {
          throw err;
        }
      }

      const text = response.text || "I'm sorry, I couldn't process that.";
      
      // Parse interactive elements
      const actions: { label: string, url?: string, command?: string }[] = [];
      const actionRegex = /\[Action:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
      const linkRegex = /\[Link:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
      
      let match;
      while ((match = actionRegex.exec(text)) !== null) {
        actions.push({ label: match[1].trim(), url: match[2].trim() });
      }
      while ((match = linkRegex.exec(text)) !== null) {
        actions.push({ label: match[1].trim(), url: match[2].trim() });
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: text.replace(/\[Action:[^\]]+\]/g, '').replace(/\[Link:[^\]]+\]/g, '').trim(),
        actions: actions.length > 0 ? actions : undefined
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please check your API key or try again later." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-20 sm:bottom-6 right-6 z-[100]"
      >
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] transition-shadow cursor-move transform-gpu"
          style={{ willChange: "transform" }}
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 sm:bottom-24 right-0 sm:right-6 w-full sm:w-[420px] h-full sm:h-[650px] sm:max-h-[85vh] bg-transparent border-t sm:border border-white/10 sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[100] flex flex-col overflow-hidden transform-gpu"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-2xl z-[-1] rounded-3xl" />

            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 flex items-center justify-between relative z-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] relative overflow-hidden group">
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      animate={isTyping ? { scale: [1, 1.5, 1], opacity: [0, 0.5, 0] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="relative flex items-center justify-center w-full h-full">
                      {isTyping ? (
                        <div className="flex gap-1 justify-center items-center">
                          <motion.div animate={{ height: [8, 16, 8] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1.5 bg-white rounded-full" />
                          <motion.div animate={{ height: [8, 20, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1.5 bg-white rounded-full" />
                          <motion.div animate={{ height: [8, 16, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 bg-white rounded-full" />
                        </div>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                          <rect x="3" y="6" width="18" height="13" rx="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <motion.circle cx={input.length > 0 ? "7.5" : "8.5"} cy={input.length > 0 ? "10.5" : "11.5"} r="1.5" fill="currentColor" animate={input.length > 0 ? { x: 1, y: 1, scaleY: [1, 0.1, 1] } : { scaleY: [1, 0.1, 1] }} transition={input.length > 0 ? { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 } : { duration: 3, repeat: Infinity, repeatDelay: 2 }} />
                          <motion.circle cx={input.length > 0 ? "16.5" : "15.5"} cy={input.length > 0 ? "10.5" : "11.5"} r="1.5" fill="currentColor" animate={input.length > 0 ? { x: -1, y: 1, scaleY: [1, 0.1, 1] } : { scaleY: [1, 0.1, 1] }} transition={input.length > 0 ? { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 } : { duration: 3, repeat: Infinity, repeatDelay: 2 }} />
                          <motion.path d={input.length > 0 ? "M9 13C9 13 10.5 15 12 15C13.5 15 15 13 15 13" : "M9 15C9 15 10.5 16.5 12 16.5C13.5 16.5 15 15 15 15"} stroke="currentColor" strokeWidth={input.length > 0 ? "2" : "1.5"} strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#0a0a0a] rounded-full ${isTyping ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                    Sunrise AI <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">v3.0</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-[#00F0FF] focus:outline-none focus:border-[#00F0FF]/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <option value="gemma-2-2b-it">Gemma 4 (New & Smart) ✨</option>
                      <option value="gemini-3-flash-preview">High Quality (G3 Flash)</option>
                      <option value="gemini-2.5-flash">Medium Quality (G2.5 Flash)</option>
                      <option value="gemini-3.1-flash-lite-preview">Fast (G3.1 Lite)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleNewChat}
                  className="text-gray-400 hover:text-[#00F0FF] transition-all p-2 hover:bg-white/5 rounded-xl flex items-center gap-1.5 group"
                  title="New Chat"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[11px] font-bold hidden sm:inline">Reset</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-red-500/10 rounded-xl group"
                    title="Close Assistant"
                  >
                    <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Wallpaper Backgrounds */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-3xl opacity-60">
              {wallpaper === 'bubbles' && bubblesData.map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-[#00F0FF]/40 shadow-[inset_0_0_20px_rgba(0,240,255,0.3),_0_0_15px_rgba(0,240,255,0.2)] bg-gradient-to-tr from-[#00F0FF]/30 to-transparent backdrop-blur-sm bubble-anim"
                  style={{ width: b.size, height: b.size, left: b.left, '--duration': `${b.duration}s`, '--delay': `${b.delay}s` } as React.CSSProperties}
                />
              ))}
              {wallpaper === 'stars' && starsData.map((s, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white star-anim"
                  style={{ width: s.size, height: s.size, left: s.left, top: s.top, '--duration': `${s.duration}s`, '--delay': `${s.delay}s` } as React.CSSProperties}
                />
              ))}
              {wallpaper === 'neon' && (
                <div className="absolute inset-0 neon-cycle">
                  <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/30 rounded-full blur-[120px]" />
                  <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#B026FF]/30 rounded-full blur-[120px]" />
                </div>
              )}
              {wallpaper === 'skeleton' && (
                <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden flex items-end justify-center pointer-events-none opacity-40 mix-blend-screen">
                  <div className="absolute w-[200%] h-[200%] skeleton-perspective-grid" />
                  <div className="absolute w-full h-[4px] bg-[#B026FF] skeleton-laser" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                </div>
              )}
            </div>

            {/* Top Right Wallpaper Menu */}
            <div className="absolute top-16 right-4 z-30">
              <button 
                onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
                className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1.5 text-white/50 hover:text-white transition-colors"
              >
                <Zap className="w-3 h-3" />
              </button>
              {showWallpaperMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 flex flex-col gap-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 w-32 shadow-2xl"
                >
                   {['default', 'bubbles', 'stars', 'neon', 'skeleton'].map(t => (
                     <button
                       key={t}
                       onClick={() => { setWallpaper(t as any); setShowWallpaperMenu(false); }}
                       className={`text-left px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors ${wallpaper === t ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                     >
                       {t}
                     </button>
                   ))}
                </motion.div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-black/10 relative z-10">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={`msg-${idx}`} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden ${
                    msg.role === 'user' ? 'bg-white/10 border border-white/10' : 'bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-[#00F0FF]'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#00F0FF]">
                        <rect x="3" y="6" width="18" height="13" rx="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor" />
                        <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor" />
                        <path d="M9 15C9 15 10.5 16.5 12 16.5C13.5 16.5 15 15 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-[#00F0FF]/15 to-[#B026FF]/15 border border-[#00F0FF]/30 text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-md'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <div className="space-y-4">
                        <div className="markdown-body prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        {msg.actions && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                            {msg.actions.map((action, aIdx) => (
                              <button
                                key={`action-${aIdx}`}
                                onClick={() => {
                                  if (action.url?.startsWith('http')) {
                                    window.open(action.url, '_blank');
                                  } else if (action.url) {
                                    window.location.href = action.url;
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-bold hover:bg-[#00F0FF]/20 hover:scale-105 transition-all flex items-center gap-2 group"
                              >
                                {action.label}
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group">
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div className="flex gap-1 justify-center items-center">
                        <motion.div animate={{ height: [8, 16, 8] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1.5 bg-white rounded-full" />
                        <motion.div animate={{ height: [8, 20, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1.5 bg-white rounded-full" />
                        <motion.div animate={{ height: [8, 16, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-none flex flex-col gap-3 min-w-[200px] backdrop-blur-md">
                    <div className="flex items-center gap-2">
                       <span className="text-xl animate-bounce">🤔</span>
                       <div className="flex flex-col">
                         <span className="text-[12px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">Processing</span>
                         <span className="text-[10px] text-gray-400 font-mono">Thinking about it...</span>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2 relative">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent" 
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00F0FF]/50 focus:bg-white/10 transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${input.trim() ? 'bg-[#00F0FF] animate-pulse' : 'bg-gray-600'}`}></div>
                  </div>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-[9px] text-center text-gray-500 mt-3 font-medium uppercase tracking-tighter">
                Sunrise AI can make mistakes. Check important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
