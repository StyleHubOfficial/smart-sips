import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Play, Pause, Maximize2, Minimize2, FileText, X, Plus, Volume2 } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useConceptVisualizerStore } from '../store/useConceptVisualizerStore';
import CinematicLoader from '../components/CinematicLoader';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function ConceptVisualizer() {
  const {
    query,
    sourceFile,
    loading,
    visualizerData,
    model,
    setQuery,
    setSourceFile,
    setModel,
    generateVisualization,
  } = useConceptVisualizerStore();

  const addNotification = useNotificationStore((state) => state.addNotification);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData } = location.state;
      const autoQuery = `Explain the concept of ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Focus on: ${extractedData?.keyConcepts?.join(', ') || ''}`;
      setQuery(autoQuery);

      setTimeout(() => {
        let apiKey = '';
        if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
          apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        }
        if (apiKey) {
          useConceptVisualizerStore.getState().setQuery(autoQuery);
          useConceptVisualizerStore.getState().generateVisualization(apiKey);
        }
      }, 500);

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
        mimeType: file.type || 'text/plain',
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
      await generateVisualization(apiKey);
    } catch (error) {
      console.error('Generation Error:', error);
      addNotification('error', 'Failed to generate concept visualization. Please try again.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (visualizerData?.audioData && audioRef.current) {
      const audioBlob = new Blob([Uint8Array.from(atob(visualizerData.audioData), c => c.charCodeAt(0))], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => console.error("Auto-play failed:", err));
      setIsPlayingAudio(true);
    }
  }, [visualizerData]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            <Sparkles className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              Concept <span className="text-gradient">Visualizer</span>
            </h2>
            <p className="text-gray-400">Transform scientific concepts into interactive visual explanations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="gemini-3-flash-preview">Smart/Quality (Gemini 3 Flash)</option>
                <option value="gemini-3.1-flash-lite-preview">Fast (Gemini 3.1 Flash Lite)</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Concept / Topic</label>
                {sourceFile && (
                  <div className="flex items-center gap-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] px-2 py-1 rounded-lg text-xs">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{sourceFile.name}</span>
                    <button onClick={() => setSourceFile(null)} className="hover:text-white transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Quantum Entanglement, Mitosis, Black Holes..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all resize-none h-32"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.csv,.json,.md,.png,.jpg,.jpeg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00F0FF] transition-colors"
                  title="Upload Source File"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || (!query.trim() && !sourceFile)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Generating...' : 'Visualize Concept'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`relative glass-panel rounded-2xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col ${isFullscreen ? 'fixed inset-0 z-[200] rounded-none bg-[#050505]' : ''}`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="ml-2 text-xs font-mono text-gray-500 uppercase tracking-widest">Classroom_Mode</span>
              </div>

              <div className="flex items-center gap-2">
                {visualizerData && (
                  <>
                    {visualizerData.audioData && (
                      <button
                        onClick={toggleAudio}
                        className="p-2 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
                        title={isPlayingAudio ? "Pause Explanation" : "Play Hinglish Explanation"}
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Hinglish Audio</span>
                      </button>
                    )}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-[#050505] overflow-auto p-6 md:p-10">
              {loading ? (
                <div className="w-full max-w-2xl mx-auto flex items-center justify-center h-full">
                  <CinematicLoader />
                </div>
              ) : visualizerData ? (
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">{visualizerData.topic}</h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] mx-auto rounded-full"></div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5">
                    <h3 className="text-xl font-bold text-[#00F0FF] mb-4">Concept Explanation</h3>
                    <div className="prose prose-invert max-w-none text-lg leading-relaxed">
                      <Markdown>{visualizerData.explanation}</Markdown>
                    </div>
                  </div>

                  {visualizerData.diagramSvg && (
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center">
                      <h3 className="text-xl font-bold text-[#00F0FF] mb-6 w-full text-left">Visual Diagram</h3>
                      <div className="w-full max-w-2xl bg-[#0f172a] rounded-xl p-4 border border-white/10 flex justify-center" dangerouslySetInnerHTML={{ __html: visualizerData.diagramSvg }} />
                    </div>
                  )}

                  {visualizerData.formulas && visualizerData.formulas.length > 0 && (
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5">
                      <h3 className="text-xl font-bold text-[#00F0FF] mb-4">Key Formulas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visualizerData.formulas.map((f, i) => (
                          <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/10">
                            <div className="font-mono text-lg text-white mb-2">{f.formula}</div>
                            <div className="text-sm text-gray-400">{f.explanation}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {visualizerData.realLifeExamples && visualizerData.realLifeExamples.length > 0 && (
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5">
                      <h3 className="text-xl font-bold text-[#00F0FF] mb-4">Real-Life Applications</h3>
                      <div className="space-y-4">
                        {visualizerData.realLifeExamples.map((ex, i) => (
                          <div key={i} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 flex items-center justify-center shrink-0 text-[#00F0FF] font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{ex.title}</h4>
                              <p className="text-gray-400">{ex.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                    <Sparkles className="w-10 h-10 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-gray-500">No Concept Visualized</h3>
                    <p className="text-gray-600 max-w-xs mx-auto">Enter a topic or upload a document to generate an interactive visual explanation.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
