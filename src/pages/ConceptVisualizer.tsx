import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Maximize2, Minimize2, FileText, X, Plus, Share2, Wand2, Image as ImageIcon, Upload, Database, ChevronRight } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useConceptVisualizerStore } from '../store/useConceptVisualizerStore';
import { useUploadStore } from '../store/useUploadStore';
import { useAuthStore } from '../store/useAuthStore';
import CinematicLoader from '../components/CinematicLoader';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { GoogleGenAI } from '@google/genai';

export default function ConceptVisualizer() {
  const {
    query,
    sourceFile,
    loading,
    visualizerData,
    model,
    diagramCount,
    setQuery,
    setSourceFile,
    setModel,
    setDiagramCount,
    generateVisualization,
  } = useConceptVisualizerStore();

  const addNotification = useNotificationStore((state) => state.addNotification);
  const { addUpload } = useUploadStore();
  const { role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [isPromptBuilding, setIsPromptBuilding] = useState(false);
  const [dashboardFiles, setDashboardFiles] = useState<any[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);

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

  const handleDashboardFileSelect = async (file: any) => {
    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'File size must be less than 5MB');
      return;
    }

    try {
      let base64String = '';
      let mimeType = file.type || 'application/pdf';

      if (file.url.startsWith('data:')) {
        base64String = file.url.split(',')[1];
        mimeType = file.url.split(';')[0].split(':')[1];
      } else {
        base64String = btoa("Simulated file content for " + file.name);
      }

      setSourceFile({
        name: file.name,
        data: base64String,
        mimeType: mimeType,
      });
      addNotification('success', 'File selected from dashboard');
      setIsFileSelectorOpen(false);
    } catch (error) {
      console.error('Error processing dashboard file:', error);
      addNotification('error', 'Failed to process selected file');
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
        contents: `Act as an expert educational prompt engineer. Convert the following simple topic into a detailed, structured, and classroom-friendly AI prompt for generating high-quality educational diagrams and concept maps. 
        Topic: "${query}"
        The output should be a single detailed prompt that includes key concepts, visual structure, diagram types, and educational goals. 
        Return ONLY the prompt text.`,
      });

      if (response.text) {
        setQuery(response.text.trim());
        addNotification('success', 'Detailed visualization prompt generated!');
      }
    } catch (error) {
      console.error('Prompt Builder Error:', error);
      addNotification('error', 'Failed to build detailed prompt.');
    } finally {
      setIsPromptBuilding(false);
    }
  };

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
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const handleUploadToCourses = async () => {
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
        ${visualizerData.diagrams.map((d, i) => `
        <div class="section">
            <h2>Diagram ${i + 1}: ${d.title}</h2>
            <p>${d.description}</p>
            <div style="background: #0f172a; padding: 20px; border-radius: 8px;">
              ${d.svgCode}
            </div>
        </div>`).join('')}
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${visualizerData.topic.replace(/[^a-z0-9]/gi, '_')}_Visualization.html`, { type: 'text/html' });
      const contextStr = `title=${visualizerData.topic} Visualization|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=Science|class=General|description=AI-generated visualization for ${visualizerData.topic}|fileType=HTML Visualization`;
      
      addUpload(file, contextStr);
      addNotification('success', 'Visualization uploaded to courses successfully!');
    } catch (error) {
      addNotification('error', 'Failed to upload visualization.');
    }
  };

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
            <ImageIcon className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              Concept <span className="text-gradient">Visualizer</span>
            </h2>
            <p className="text-gray-400">Generate educational diagrams and visual structures</p>
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
                <option value="gemini-3-flash-preview">High Quality (G3 Flash)</option>
                <option value="gemini-3.1-flash-lite-preview">Medium Quality (G3.1 Lite)</option>
                <option value="gemini-2.5-flash">Fast (G2.5 Flash)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Diagram Count</label>
              <select
                value={diagramCount}
                onChange={(e) => setDiagramCount(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value={1}>1 Diagram</option>
                <option value={2}>2 Diagrams</option>
                <option value={3}>3 Diagrams</option>
                <option value={4}>4 Diagrams</option>
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pr-12 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all resize-none h-32"
                />
                <button 
                  onClick={handlePromptBuild}
                  disabled={isPromptBuilding || !query.trim()}
                  className="absolute right-3 top-3 p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-all disabled:opacity-30"
                  title="AI Prompt Builder"
                >
                  {isPromptBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.csv,.json,.md,.png,.jpg,.jpeg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Device</span>
                </button>
                <button
                  onClick={() => {
                    setIsFileSelectorOpen(true);
                    fetchDashboardFiles();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Database className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || (!query.trim() && !sourceFile)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                {loading ? 'Generating...' : 'Generate Diagrams'}
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
                      onClick={handleUploadToCourses}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/30 transition-all text-sm font-bold"
                    >
                      <Upload className="w-4 h-4" />
                      Upload to Courses
                    </button>
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
                  <div className="w-full max-w-md space-y-2 text-center">
                    <span className="text-xs font-mono text-[#00F0FF]">Generating Educational Diagrams...</span>
                  </div>
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
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{visualizerData.explanation}</Markdown>
                    </div>
                  </div>

                  {visualizerData.diagrams && visualizerData.diagrams.map((diagram, index) => (
                    <div key={`${diagram.title}-${index}`} className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center">
                      <div className="w-full text-left mb-6">
                        <h3 className="text-xl font-bold text-[#00F0FF]">{diagram.title}</h3>
                        <p className="text-gray-400 mt-2">{diagram.description}</p>
                      </div>
                      <div className="w-full max-w-3xl bg-[#0f172a] rounded-xl p-4 border border-white/10 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: diagram.svgCode }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4 h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                    <ImageIcon className="w-10 h-10 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-gray-500">No Diagrams Generated</h3>
                    <p className="text-gray-600 max-w-xs mx-auto">Enter a topic or upload a document to generate educational diagrams.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFileSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF]">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Select from Dashboard</h3>
                </div>
                <button 
                  onClick={() => setIsFileSelectorOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {fetchingFiles ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" />
                    <p className="text-gray-400">Fetching your files...</p>
                  </div>
                ) : dashboardFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No files found in your dashboard.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {dashboardFiles.map((file, index) => (
                      <button
                        key={file.id || `dashboard-file-${index}`}
                        onClick={() => {
                          handleDashboardFileSelect(file);
                          setIsFileSelectorOpen(false);
                        }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 transition-all group text-left"
                      >
                        <div className="p-3 rounded-xl bg-white/5 text-gray-400 group-hover:text-[#00F0FF] transition-colors">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold truncate">{file.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span>{file.type || 'Document'}</span>
                            <span>•</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#00F0FF] transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
