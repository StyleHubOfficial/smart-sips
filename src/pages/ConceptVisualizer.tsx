import React, { useState, useRef, useEffect } from 'react';
import { pcmToWav } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Play, Pause, Maximize2, Minimize2, FileText, X, Plus, Volume2, Share2 } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useConceptVisualizerStore } from '../store/useConceptVisualizerStore';
import { useUploadStore } from '../store/useUploadStore';
import { useAuthStore } from '../store/useAuthStore';
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
  const { addUpload } = useUploadStore();
  const { role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData, autoFillQuery } = location.state;
      const autoQuery = autoFillQuery || `Explain the concept of ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Focus on: ${extractedData?.keyConcepts?.join(', ') || ''}`;
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
      if (!document.fullscreenElement) setIsExplaining(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (visualizerData?.audioData) {
      const pcmData = Uint8Array.from(atob(visualizerData.audioData), c => c.charCodeAt(0));
      const wavData = pcmToWav(pcmData);
      const audioBlob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setAudioProgress(100);
      return () => URL.revokeObjectURL(url);
    } else if (loading) {
      setAudioUrl(null);
      setAudioProgress(0);
      const interval = setInterval(() => {
        setAudioProgress(prev => Math.min(prev + 2, 95));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [visualizerData, loading]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || !visualizerData?.highlightingSteps) return;
    const currentTime = audioRef.current.currentTime;
    const activeStep = visualizerData.highlightingSteps.find(
      step => currentTime >= step.startTime && currentTime <= step.endTime
    );
    setCurrentHighlight(activeStep ? activeStep.text : null);
  };

  const startExplaining = () => {
    if (!visualizerData?.audioData) return;
    setIsExplaining(true);
    setIsFullscreen(true);
    document.documentElement.requestFullscreen();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

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

  const handleShare = async () => {
    if (!visualizerData) return;
    const shareData = {
      title: `Smart Sunrise - ${visualizerData.topic}`,
      text: `Check out this AI-generated visualization for ${visualizerData.topic}!`,
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

  const handleSaveToDashboard = async () => {
    if (!visualizerData) return;
    
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #0f172a; color: white; font-family: sans-serif; padding: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #00F0FF; border-bottom: 2px solid #00F0FF; padding-bottom: 10px; }
        .section { background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155; }
        .formula { font-family: monospace; background: #000; padding: 10px; border-radius: 6px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${visualizerData.topic}</h1>
        <div class="section">
            <h2>Explanation</h2>
            <p>${visualizerData.explanation}</p>
        </div>
        ${visualizerData.formulas.length > 0 ? `
        <div class="section">
            <h2>Formulas</h2>
            ${visualizerData.formulas.map(f => `<div class="formula"><strong>${f.formula}</strong>: ${f.explanation}</div>`).join('')}
        </div>` : ''}
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${visualizerData.topic.replace(/[^a-z0-9]/gi, '_')}_Visualization.html`, { type: 'text/html' });
      const contextStr = `title=${visualizerData.topic} Visualization|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=Science|class=General|description=AI-generated visualization for ${visualizerData.topic}|fileType=HTML Visualization`;
      
      addUpload(file, contextStr);
      addNotification('success', 'Visualization saved to dashboard!');
    } catch (error) {
      addNotification('error', 'Failed to save visualization.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl}
          onEnded={() => {
            setIsPlayingAudio(false);
            setIsExplaining(false);
          }} 
          onTimeUpdate={handleTimeUpdate}
          className="hidden" 
        />
      )}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <Sparkles className="w-8 h-8 text-black" />
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
                <option value="gemini-3.1-pro-preview">High Quality</option>
                <option value="gemini-2.5-flash">Medium Quality</option>
                <option value="gemini-3.1-flash-lite-preview">Fast</option>
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
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-all"
                      title="Share Visualization"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveToDashboard}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/30 transition-all text-sm font-bold"
                    >
                      <Share2 className="w-4 h-4" />
                      Save to Dashboard
                    </button>
                    <button
                      onClick={startExplaining}
                      disabled={!visualizerData.audioData}
                      className="p-2 rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                      title="Start Fullscreen Explanation"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Explain</span>
                    </button>
                    {visualizerData.audioData && (
                      <button
                        onClick={toggleAudio}
                        className="p-2 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
                        title={isPlayingAudio ? "Pause Explanation" : "Play Hinglish Explanation"}
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Audio</span>
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
            <div className="flex-1 relative bg-[#050505] overflow-auto p-6 md:p-10 custom-scrollbar">
              {loading ? (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-full space-y-8">
                  <CinematicLoader />
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs font-mono text-[#00F0FF]">
                      <span>Generating Visuals & Audio...</span>
                      <span>{audioProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${audioProgress}%` }}
                        className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF]"
                      />
                    </div>
                  </div>
                </div>
              ) : visualizerData ? (
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">{visualizerData.topic}</h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] mx-auto rounded-full"></div>
                  </div>

                  <div className={`glass-panel p-6 rounded-2xl border transition-all duration-500 ${currentHighlight && visualizerData.explanation.includes(currentHighlight) ? 'border-[#00F0FF] bg-[#00F0FF]/5 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'border-white/10 bg-white/5'}`}>
                    <h3 className="text-xl font-bold text-[#00F0FF] mb-4">Concept Explanation</h3>
                    <div className="prose prose-invert max-w-none text-lg leading-relaxed">
                      <Markdown>{visualizerData.explanation}</Markdown>
                    </div>
                  </div>

                  {visualizerData.animationCode && (
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5">
                      <h3 className="text-xl font-bold text-[#00F0FF] mb-6">Animated Visualization</h3>
                      <div className="w-full aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative">
                        <iframe
                          srcDoc={`
                            <html>
                              <head>
                                <style>
                                  body { margin: 0; background: #000; color: #fff; font-family: sans-serif; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                                  canvas { max-width: 100%; max-height: 100%; }
                                </style>
                              </head>
                              <body>
                                ${visualizerData.animationCode}
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-none"
                          title="Concept Animation"
                        />
                      </div>
                    </div>
                  )}

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
                          <div key={i} className={`p-4 rounded-xl border transition-all duration-500 ${currentHighlight && f.formula.includes(currentHighlight) ? 'border-[#00F0FF] bg-[#00F0FF]/10' : 'bg-black/40 border-white/10'}`}>
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
                          <div key={i} className={`flex gap-4 items-start p-4 rounded-xl transition-all duration-500 ${currentHighlight && ex.title.includes(currentHighlight) ? 'bg-[#00F0FF]/10 border border-[#00F0FF]/30' : ''}`}>
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
