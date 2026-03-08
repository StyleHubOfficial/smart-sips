import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Sparkles, Zap, Maximize, Minimize, Code, RotateCcw, Download, Play, Box, Layers, MonitorPlay, Save, Trash2, History, ChevronRight, Share2, FlaskConical, Atom, FileText, X, Plus, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useUploadStore } from '../store/useUploadStore';
import SimLoader from '../components/SimLoader';
import { useLocation } from 'react-router-dom';
import { generateHinglishExplanation } from '../services/aiExplainerService';

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
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [explainerData, setExplainerData] = useState<{ text: string; audioData: string | null } | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
        const audioBlob = await fetch(`data:audio/wav;base64,${data.audioData}`).then(res => res.blob());
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

  const handleSaveToDashboard = async () => {
    if (!generatedCode) return;
    
    try {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const file = new File([blob], `${query.replace(/[^a-z0-9]/gi, '_')}_simulation.html`, { type: 'text/html' });
      const contextStr = `title=${query} Simulation|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=Simulation|class=General|description=AI-generated interactive simulation for ${query}|fileType=HTML Simulation`;
      
      addUpload(file, contextStr);
      addNotification('info', 'Saving simulation to dashboard...');
    } catch (error) {
      addNotification('error', 'Failed to save simulation.');
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
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <FlaskConical className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white flex items-center gap-3">
              AI Virtual Laboratory
              <span className="text-[10px] bg-[#00F0FF]/20 text-[#00F0FF] px-2 py-0.5 rounded-full border border-[#00F0FF]/30 uppercase tracking-widest">v2.0</span>
            </h2>
            <p className="text-gray-400">Generate interactive science experiments from any topic or document</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
            <button 
              onClick={() => setSubject('physics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subject === 'physics' ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              Physics
            </button>
            <button 
              onClick={() => setSubject('chemistry')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subject === 'chemistry' ? 'bg-[#B026FF] text-white shadow-[0_0_15px_rgba(176,38,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              Chemistry
            </button>
          </div>
          
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
            <button 
              onClick={() => setMode('2d')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === '2d' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              2D
            </button>
            <button 
              onClick={() => setMode('3d')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === '3d' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              3D
            </button>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all ${
              showHistory ? 'bg-[#B026FF]/20 border-[#B026FF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="font-bold">History</span>
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

      {/* Controls Section */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10 space-y-4 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B026FF]/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3" /> Subject & Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSubject('physics')}
                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  subject === 'physics' 
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' 
                    : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <Atom className="w-4 h-4" /> Physics
              </button>
              <button
                onClick={() => setSubject('chemistry')}
                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  subject === 'chemistry' 
                    ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/30' 
                    : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <FlaskConical className="w-4 h-4" /> Chemistry
              </button>
            </div>
            
            {subject === 'physics' && (
              <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 mt-2">
                <button
                  onClick={() => setMode('2d')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    mode === '2d' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3 h-3" /> 2D
                </button>
                <button
                  onClick={() => setMode('3d')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    mode === '3d' 
                      ? 'bg-[#B026FF]/20 text-[#B026FF]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3 h-3" /> 3D
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3 h-3" /> AI Model
            </label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="gemini-3.1-pro-preview">High Quality</option>
              <option value="gemini-2.5-flash">Medium Quality</option>
              <option value="gemini-3.1-flash-lite-preview">Fast</option>
            </select>
          </div>

          <div className="flex justify-end pb-1">
             {generatedCode && (
               <div className="flex gap-2">
                 <button 
                   onClick={handleExplain}
                   disabled={explainerLoading}
                   className="p-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
                   title="Explain in Hinglish"
                 >
                   {explainerLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                   <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Explain</span>
                 </button>
                 <button 
                   onClick={handleSave}
                   className="p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-[#B026FF] hover:border-[#B026FF]/50 transition-all"
                   title="Save to History"
                 >
                   <Save className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setShowCode(!showCode)}
                   className={`p-3 rounded-xl border transition-all ${showCode ? 'bg-white/10 border-white/30 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                   title="View Code"
                 >
                   <Code className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={handleDownload}
                   className="p-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                   title="Download HTML"
                 >
                   <Download className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={handleSaveToDashboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B026FF]/20 hover:bg-[#B026FF]/30 text-[#B026FF] border border-[#B026FF]/30 transition-all text-sm font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    Save to Dashboard
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center pt-2 z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.txt,.csv,.json,.md,.png,.jpg,.jpeg"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00F0FF] transition-colors z-10"
            title="Upload Source File"
          >
            <Plus className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder={`Describe the ${subject} simulation...`}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-[#B026FF]/50 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            {sourceFile && (
               <div className="flex items-center gap-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] px-3 py-2 rounded-xl text-sm">
                 <FileText className="w-4 h-4" />
                 <span className="truncate max-w-[150px]">{sourceFile.name}</span>
                 <button onClick={() => setSourceFile(null)} className="hover:text-white transition-colors ml-1">
                   <X className="w-4 h-4" />
                 </button>
               </div>
             )}
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || (!query.trim() && !sourceFile)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Generating...' : 'Generate Simulation'}
          </button>
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group"
          >
            {/* Toolbar Overlay */}
            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={handleGenerate}
                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
                title="Regenerate"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>

            {showCode ? (
              <div className="absolute inset-0 bg-[#0d1117] p-6 overflow-auto font-mono text-sm text-gray-300 z-10">
                <pre>{generatedCode}</pre>
              </div>
            ) : (
              <iframe 
                ref={iframeRef}
                srcDoc={generatedCode}
                title="Simulation Preview"
                className="w-full h-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
          </motion.div>
        )}
        
        {!loading && !generatedCode && (
          <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Enter a concept above to generate an interactive simulation</p>
          </div>
        )}
      </div>

      {/* Explainer Panel */}
      <AnimatePresence>
        {showExplainer && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-24 right-6 w-full max-w-md z-50"
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
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 leading-relaxed text-sm italic">
                      {explainerData.text}
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
          onEnded={() => setIsAudioPlaying(false)}
          className="hidden"
        />
      )}
    </motion.div>
  );
}
