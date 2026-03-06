import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Sparkles, Zap, Maximize, Minimize, Code, RotateCcw, Download, Play, Box, Layers, MonitorPlay } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import CinematicLoader from '../components/CinematicLoader';

export default function Simulator() {
  const { 
    query, generatedCode, loading, model, mode,
    setQuery, setGeneratedCode, setModel, setMode, generateSimulation, clearSimulation
  } = useSimulatorStore();
  
  const addNotification = useNotificationStore(state => state.addNotification);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    
    // Robust API Key Retrieval
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
      <div className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <MonitorPlay className="w-8 h-8 text-[#00F0FF]" />
        </div>
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            Simulator <span className="text-gradient">Generator</span>
          </h2>
          <p className="text-gray-400">AI-powered interactive 2D & 3D physics simulations</p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10 space-y-4 relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00F0FF]/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3" /> Simulation Mode
            </label>
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setMode('2d')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === '2d' 
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Box className="w-4 h-4" /> 2D Canvas
              </button>
              <button
                onClick={() => setMode('3d')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === '3d' 
                    ? 'bg-[#B026FF]/20 text-[#B026FF] shadow-[0_0_10px_rgba(176,38,255,0.2)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Box className="w-4 h-4" /> 3D WebGL
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3 h-3" /> AI Model
            </label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>

          <div className="flex justify-end pb-1">
             {generatedCode && (
               <div className="flex gap-2">
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
               </div>
             )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center pt-2 z-10">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder={`Describe the simulation (e.g., "Solar system with gravity", "Double pendulum", "Particle collision")...`}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-32 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all shadow-inner"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !query.trim()}
            className="absolute right-2 px-6 py-2 rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Simulation Area */}
      <div className="space-y-6">
        {loading && (
          <div className="py-12">
            <CinematicLoader />
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
    </motion.div>
  );
}
