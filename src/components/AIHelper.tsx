import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import ReactMarkdown from 'react-markdown';
import { useFirebaseMessages } from '../hooks/useFirebaseMessages';

export default function AIHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hello! I am your Sunrise AI Assistant. How can I help you today? You can ask me about using the platform, or submit feedback/ideas to the developer.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'ai' | 'admin' | 'developer'>('ai');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { role } = useAuthStore();
  const { onlineTimes } = useAppStore();
  const { messages: currentChatMessages, sendMessage } = useFirebaseMessages(role, mode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentChatMessages, isOpen, mode]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');

    if (mode === 'admin' || mode === 'developer') {
      await sendMessage(userMsg);
      return;
    }

    // Handle AI Chat
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const prompt = `You are a helpful, professional AI assistant for the 'Sunrise Classroom Panel', an educational platform.
      The user is currently logged in as a: ${role}.
      Keep your answers concise, well-formatted using markdown, and friendly.
      User's message: ${userMsg}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center z-50 hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] transition-shadow"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] max-h-[80vh] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center">
                  {mode === 'ai' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-sm">
                    {mode === 'ai' ? 'Sunrise AI Helper' : mode === 'admin' ? 'Admin Support' : 'Lakshya Bhamu (Developer)'}
                  </h3>
                  <p className="text-[10px] text-[#00F0FF]">
                    {mode === 'ai' ? 'Online' : onlineTimes[mode] ? `Available: ${onlineTimes[mode]}` : 'Online'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/20">
              {mode === 'ai' ? (
                messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-white/10' : 'bg-[#00F0FF]/20 text-[#00F0FF]'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-white rounded-tr-sm' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <div className="markdown-body prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                currentChatMessages.map((msg) => {
                  const isMe = msg.senderRole === role;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id} 
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm relative ${
                        isMe 
                          ? 'bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-white rounded-tr-sm' 
                          : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                      }`}>
                        <div className="mb-1">{msg.text}</div>
                        <div className={`text-[10px] flex items-center justify-end gap-1 ${isMe ? 'text-[#00F0FF]/70' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {isLoading && mode === 'ai' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/50">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
                <button 
                  onClick={() => setMode('ai')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${mode === 'ai' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Bot className="w-3 h-3 inline mr-1" /> Ask AI
                </button>
                <button 
                  onClick={() => setMode('admin')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${mode === 'admin' ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <User className="w-3 h-3 inline mr-1" /> Message Admin
                </button>
                <button 
                  onClick={() => setMode('developer')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${mode === 'developer' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Lightbulb className="w-3 h-3 inline mr-1" /> Message Dev
                </button>
              </div>

              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={mode === 'ai' ? "Ask me anything..." : "Type a message..."}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || (isLoading && mode === 'ai')}
                  className="absolute right-2 p-2 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
