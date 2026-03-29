import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Sparkles, Zap, Maximize, Minimize, Code, RotateCcw, Download, Play, Box, Layers, MonitorPlay, Save, Trash2, History, ChevronRight, Share2, FlaskConical, Atom, FileText, X, Plus, MessageSquare, Volume2, VolumeX, Wand2, Database, Upload, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useUploadStore } from '../store/useUploadStore';
import SimLoader from '../components/SimLoader';
import { DashboardFileSelector } from '../components/DashboardFileSelector';
import { useLocation } from 'react-router-dom';
import { generateHinglishExplanation } from '../services/aiExplainerService';
import { pcmToWav } from '../utils/audio';
import { GoogleGenAI } from '@google/genai';

export default function Simulator() {
  const { 
    query, generatedCode, loading, model, mode, savedSimulations, subject, sourceFile,
    setQuery, setGeneratedCode, setModel, setMode, generateSimulation, clearSimulation, saveCurrentSimulation, deleteSimulation, loadSimulation, setSubject, setSourceFile
  } = useSimulatorStore();
  
  const addNotification = useNotificationStore(state => state.addNotification);
  const { addUpload } = useUploadStore();
  const { role } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [dashboardFiles, setDashboardFiles] = useState<any[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [dashboardSubject, setDashboardSubject] = useState("");
  const [dashboardType, setDashboardType] = useState("");
  const [dashboardTopic, setDashboardTopic] = useState("");
  const [isPromptBuilding, setIsPromptBuilding] = useState(false);

  const fetchDashboardFiles = async () => {
    try {
      setFetchingFiles(true);
      const res = await fetch("/api/content");
      if (res.ok) {
        const data = await res.json();
        setDashboardFiles(data.resources || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard files", error);
    } finally {
      setFetchingFiles(false);
    }
  };
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [explainerData, setExplainerData] = useState<{ text: string; audioData: string | null } | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const handleExplain = async () => {
    if (!generatedCode) return;
    
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing.');
      return;
    }

    setExplainerLoading(true);
    setShowExplainer(true);
    try {
      const data = await generateHinglishExplanation(query, generatedCode, apiKey);
      setExplainerData(data);
      if (data.audioData) {
        const pcmData = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
        const wavData = pcmToWav(pcmData);
        const audioBlob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error("Explainer Error:", error);
      addNotification('error', 'Failed to generate explanation.');
    } finally {
      setExplainerLoading(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData } = location.state;
      const autoQuery = `Generate a simulation for: ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Focus on: ${extractedData?.keyConcepts?.join(', ') || ''}`;
      setQuery(autoQuery);
      
      // Auto-generate after a short delay to allow state to settle
      setTimeout(() => {
        // Use the store's generate function directly with the new query
        let apiKey = '';
        if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
          apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        }
        if (apiKey) {
          useSimulatorStore.getState().setQuery(autoQuery);
          useSimulatorStore.getState().generateSimulation(apiKey);
        }
      }, 500);
      
      // Clear state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setSourceFile({
        name: file.name,
        data: base64String,
        mimeType: file.type || 'text/plain'
      });
      addNotification('success', 'Source file attached successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleDashboardFileSelect = async (file: any) => {
    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'File size must be less than 5MB');
      return;
    }

    try {
      let base64String = '';
      let mimeType = file.type || 'application/pdf';
      const fileName = file.context?.custom?.title || file.context?.custom?.caption || file.filename || file.public_id || file.display_name || 'Untitled Document';

      if (file.url.startsWith('data:')) {
        base64String = file.url.split(',')[1];
        mimeType = file.url.split(';')[0].split(':')[1];
      } else {
        // Use proxy to fetch actual content for non-data URLs to avoid CORS issues
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(file.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy fetch failed: ${response.statusText}`);
        
        const blob = await response.blob();
        mimeType = blob.type || mimeType;
        
        base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      setSourceFile({
        name: fileName,
        data: base64String,
        mimeType: mimeType
      });
      addNotification('success', `Selected ${fileName} from dashboard`);
      setShowDashboardSelector(false);
    } catch (error) {
      console.error("Dashboard selection error:", error);
      addNotification('error', 'Failed to fetch file content from dashboard');
    }
  };

  const handlePromptBuild = async () => {
    if (!query.trim()) {
      addNotification('info', 'Please enter a simple topic first');
      return;
    }

    setIsPromptBuilding(true);
    try {
      let apiKey = '';
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
      }
      if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }

      if (!apiKey) throw new Error('API Key missing');

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Act as an expert educational prompt engineer. Convert the following simple topic into a clear, concise, and on-point AI prompt for generating a high-quality interactive simulation. 
        Topic: "${query}"
        The output should be a single, focused prompt that specifies the core concepts, 2-3 key interactive elements, and the main educational goal. Do NOT make it overly detailed or wide-ranging. Keep it strictly relevant to the topic.
        Return ONLY the prompt text.`,
      });

      if (response.text) {
        setQuery(response.text.trim());
        addNotification('success', 'Detailed simulation prompt generated!');
      }
    } catch (error) {
      console.error('Prompt Builder Error:', error);
      addNotification('error', 'Failed to build detailed prompt.');
    } finally {
      setIsPromptBuilding(false);
    }
  };

  const handleGenerate = async () => {
    if (!query.trim() && !sourceFile) return;
    
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY.');
      return;
    }

    try {
      await generateSimulation(apiKey);
    } catch (error) {
      console.error("Generation Error:", error);
      addNotification('error', 'Failed to generate simulation. Please try again.');
    }
  };

  const handleSave = () => {
    if (!generatedCode) return;
    saveCurrentSimulation();
    addNotification('success', 'Simulation saved to your history.');
  };

  const handleUploadToCourses = async () => {
    if (!generatedCode) return;
    
    try {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const file = new File([blob], `${query.replace(/[^a-z0-9]/gi, '_')}_simulation.html`, { type: 'text/html' });
      const contextStr = `title=${query} Simulation|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=Simulation|class=General|description=AI-generated interactive simulation for ${query}|fileType=HTML Simulation`;
      
      addUpload(file, contextStr);
      addNotification('info', 'Uploading simulation to courses...');
    } catch (error) {
      addNotification('error', 'Failed to upload simulation.');
    }
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    const shareData = {
      title: `Smart Sunrise - ${query}`,
      text: `Check out this AI-generated simulation for ${query}!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addNotification('success', 'Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${query.replace(/[^a-z0-9]/gi, '_')}_simulation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] shrink-0">
            <FlaskConical className="w-6 h-6 md:w-8 md:h-8 text-black" />
          </div>
          <div>
            <h2 className="text-2xl md:text-5xl font-display font-bold text-white flex items-center gap-3 flex-wrap">
              AI Virtual Laboratory
              <span className="text-[10px] bg-[#00F0FF]/20 text-[#00F0FF] px-2 py-0.5 rounded-full border border-[#00F0FF]/30 uppercase tracking-widest">v2.0</span>
            </h2>
            <p className="text-sm md:text-base text-gray-400">Generate interactive science experiments from any topic or document</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
            <button 
              onClick={() => setSubject('physics')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${subject === 'physics' ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              Physics
            </button>
            <button 
              onClick={() => setSubject('chemistry')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${subject === 'chemistry' ? 'bg-[#B026FF] text-white shadow-[0_0_15px_rgba(176,38,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              Chemistry
            </button>
          </div>
          
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
            <button 
              onClick={() => setMode('2d')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${mode === '2d' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              2D
            </button>
            <button 
              onClick={() => setMode('3d')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${mode === '3d' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              3D
            </button>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-2xl border transition-all ${
              showHistory ? 'bg-[#B026FF]/20 border-[#B026FF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-bold text-sm md:text-base">History</span>
            {savedSimulations.length > 0 && (
              <span className="bg-[#B026FF] text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                {savedSimulations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="glass-panel rounded-2xl p-6 border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSimulations.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-500">
                  No saved simulations yet.
                </div>
              ) : (
                savedSimulations.map((sim) => (
                  <div 
                    key={sim.id}
                    className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#B026FF]/50 transition-all cursor-pointer"
                    onClick={() => {
                      loadSimulation(sim.id);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white truncate pr-4">{sim.title}</h4>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSimulation(sim.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-wider">
                      <span>{sim.date}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {/* Controls Section (Input Area) - NOW AT THE TOP */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-[#B026FF]/5 pointer-events-none"></div>
          
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Simulation Lab</h2>
                  <p className="text-sm text-gray-500">Describe your concept or attach a research source</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShowDashboardSelector(true);
                    fetchDashboardFiles();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all text-sm font-semibold group"
                >
                  <Database className="w-4 h-4 group-hover:text-[#00F0FF] transition-colors" />
                  Dashboard
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all text-sm font-semibold group"
                >
                  <Upload className="w-4 h-4 group-hover:text-[#B026FF] transition-colors" />
                  Upload
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx,image/*"
                />
              </div>
            </div>

            <div className="relative group">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={sourceFile ? `Generating based on ${sourceFile.name}...` : "e.g., 'Projectile motion with air resistance', 'Chemical bonding of NaCl'..."}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition-all min-h-[120px] resize-none pr-14 text-lg leading-relaxed"
              />
              <button 
                onClick={handlePromptBuild}
                disabled={isPromptBuilding || !query.trim()}
                className="absolute bottom-5 right-5 p-3 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="AI Prompt Builder"
              >
                {isPromptBuilding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              </button>
            </div>

            {sourceFile && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[#00F0FF]/20">
                    <FileText className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{sourceFile.name}</p>
                    <p className="text-[10px] text-[#00F0FF]/70 uppercase font-bold tracking-widest">{sourceFile.mimeType}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSourceFile(null)}
                  className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-red-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Subject</span>
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                    <button 
                      onClick={() => setSubject('physics')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subject === 'physics' ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'text-gray-500 hover:text-white'}`}
                    >
                      Physics
                    </button>
                    <button 
                      onClick={() => setSubject('chemistry')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subject === 'chemistry' ? 'bg-[#B026FF] text-white shadow-[0_0_15px_rgba(176,38,255,0.4)]' : 'text-gray-500 hover:text-white'}`}
                    >
                      Chemistry
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Dimension</span>
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                    <button 
                      onClick={() => setMode('2d')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === '2d' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      2D
                    </button>
                    <button 
                      onClick={() => setMode('3d')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === '3d' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      3D
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Model</span>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#B026FF]/50 transition-all cursor-pointer"
                  >
                    <option value="gemini-3-flash-preview">G3 Flash (HQ)</option>
                    <option value="gemini-3.1-flash-lite-preview">G3.1 Lite (Med)</option>
                    <option value="gemini-2.5-flash">G2.5 Flash (Fast)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading || (!query.trim() && !sourceFile)}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-black shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(176,38,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="uppercase tracking-widest">Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span className="uppercase tracking-widest">Launch Lab</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="space-y-6">
          {loading && (
            <div className="py-12">
              <SimLoader />
            </div>
          )}

          {!loading && generatedCode && (
            <div className="space-y-8">
              {/* 1. Simulation View */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF] uppercase tracking-widest pl-2">
                  <Box className="w-3 h-3" /> Simulation Model
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black"
                >
                  <iframe 
                    ref={iframeRef}
                    srcDoc={generatedCode + `<style>#controls-container, #theory-container { display: none !important; } body { margin: 0; overflow: hidden; background: #000; }</style>`}
                    title="Simulation Model"
                    className="w-full h-full border-0 bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </motion.div>
              </div>

              {/* Simulation Toolbar */}
              <div className="flex flex-wrap justify-between items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleExplain}
                    disabled={explainerLoading}
                    className="p-2 md:p-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
                    title="Explain in Hinglish"
                  >
                    {explainerLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />}
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Explain</span>
                  </button>
                  <button 
                    onClick={() => setShowCode(!showCode)}
                    className={`p-2 md:p-3 rounded-xl border transition-all ${showCode ? 'bg-white/10 border-white/30 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                    title="View Code"
                  >
                    <Code className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white transition-all"
                    title="Regenerate"
                  >
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white transition-all"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleSave}
                    className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-[#B026FF] hover:border-[#B026FF]/50 transition-all"
                    title="Save to History"
                  >
                    <Save className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                    title="Download HTML"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-all"
                    title="Share Simulation"
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={handleUploadToCourses}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-[#B026FF]/20 hover:bg-[#B026FF]/30 text-[#B026FF] border border-[#B026FF]/30 transition-all text-[10px] md:text-sm font-bold"
                  >
                    <Upload className="w-3 h-3 md:w-4 md:h-4" />
                    Upload to Courses
                  </button>
                </div>
              </div>

              {/* 2. Controls Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B026FF] uppercase tracking-widest pl-2">
                  <Settings className="w-3 h-3" /> Interactive Controls
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-1"
                >
                  <iframe 
                    srcDoc={generatedCode + `<style>#simulation-container, #theory-container { display: none !important; } body { padding: 20px; background: #0a0a0a; color: white; font-family: 'Inter', sans-serif; }</style>`}
                    title="Simulation Controls"
                    className="w-full h-[300px] border-0 bg-[#0a0a0a]"
                  />
                </motion.div>
              </div>

              {/* 3. Theory Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF] uppercase tracking-widest pl-2">
                  <FlaskConical className="w-3 h-3" /> Scientific Theory & Explanation
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-1 shadow-[0_0_50px_rgba(176,38,255,0.1)]"
                >
                  <iframe 
                    srcDoc={generatedCode + `
                      <style>
                        #simulation-container, #controls-container { display: none !important; } 
                        body { 
                          padding: 40px; 
                          background: #0a0a0a; 
                          color: #e0e0e0; 
                          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                          line-height: 1.8; 
                          max-width: 900px;
                          margin: 0 auto;
                        }
                        h1, h2, h3 { color: #00F0FF; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; letter-spacing: -0.02em; }
                        h1 { font-size: 2.5rem; border-bottom: 2px solid #00F0FF20; padding-bottom: 10px; }
                        h2 { font-size: 1.8rem; border-left: 4px solid #B026FF; padding-left: 15px; }
                        p { margin-bottom: 1.2em; font-size: 1.1rem; }
                        ul, ol { margin-bottom: 1.2em; padding-left: 1.5em; }
                        li { margin-bottom: 0.5em; }
                        code { background: #1a1a1a; padding: 2px 6px; rounded: 4px; color: #B026FF; font-family: monospace; }
                        blockquote { border-left: 4px solid #00F0FF; padding-left: 20px; font-style: italic; color: #aaa; margin: 20px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #111; border-radius: 12px; overflow: hidden; }
                        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #222; }
                        th { background: #1a1a1a; color: #00F0FF; font-weight: bold; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em; }
                        .formula { background: #111; padding: 15px; border-radius: 12px; border: 1px solid #333; text-align: center; font-family: serif; font-size: 1.3rem; margin: 20px 0; color: #fff; }
                      </style>
                    `}
                    title="Scientific Theory"
                    className="w-full h-[600px] border-0 bg-[#0a0a0a]"
                  />
                </motion.div>
              </div>

              {showCode && (
                <div className="glass-panel rounded-2xl p-6 border border-white/10 overflow-auto font-mono text-sm text-gray-300 max-h-[500px]">
                  <pre>{generatedCode}</pre>
                </div>
              )}
            </div>
          )}
          
          {!loading && !generatedCode && (
            <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Enter a concept below to generate an interactive simulation</p>
            </div>
          )}
        </div>
      </div>

      {/* Explainer Panel */}
      <AnimatePresence>
        {showExplainer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full mt-6"
          >
            <div className="glass-panel rounded-3xl p-6 border border-[#00F0FF]/30 shadow-[0_0_50px_rgba(240,0,255,0.15)] relative overflow-hidden bg-black/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-[#B026FF]/5 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#00F0FF]/20 text-[#00F0FF]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-white">AI Explainer (Hinglish)</h3>
                </div>
                <div className="flex items-center gap-2">
                  {explainerData?.audioData && (
                    <button 
                      onClick={toggleAudio}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#00F0FF] transition-colors"
                    >
                      {isAudioPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                  )}
                  <button 
                    onClick={() => setShowExplainer(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {explainerLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-10 h-10 text-[#00F0FF] animate-spin" />
                    <p className="text-gray-400 text-sm animate-pulse">Generating Hinglish explanation...</p>
                  </div>
                ) : explainerData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 leading-relaxed text-sm">
                      {explainerData.text.split(/([.!?]+)/).filter(Boolean).map((sentence, idx, arr) => {
                        if (idx % 2 !== 0) return null;
                        const fullSentence = sentence + (arr[idx+1] || '');
                        const words = fullSentence.split(' ');
                        const totalWords = explainerData.text.split(' ').length;
                        const progress = duration > 0 ? currentTime / duration : 0;
                        const sentenceStartRatio = explainerData.text.indexOf(fullSentence) / explainerData.text.length;
                        const sentenceEndRatio = (explainerData.text.indexOf(fullSentence) + fullSentence.length) / explainerData.text.length;
                        const isHighlighted = progress >= sentenceStartRatio && progress <= sentenceEndRatio;

                        return (
                      <div 
                        key={`sentence-${idx}`} 
                        className={`transition-all duration-300 ${isHighlighted ? 'text-[#00F0FF] font-bold scale-105 inline-block' : 'opacity-60'}`}
                      >
                        {fullSentence}{' '}
                      </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> AI Generated Explanation
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No explanation generated yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl}
          autoPlay
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => {
            setIsAudioPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />
      )}

      {/* Dashboard File Selector Modal */}
      <DashboardFileSelector
        isOpen={showDashboardSelector}
        onClose={() => setShowDashboardSelector(false)}
        onSelect={handleDashboardFileSelect}
        title="Select Simulation Source"
      />
    </motion.div>
  );
}
