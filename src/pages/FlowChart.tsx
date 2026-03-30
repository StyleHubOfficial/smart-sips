import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GrammarTextarea } from '../components/GrammarTextarea';
import { Search, Loader2, Sparkles, Zap, Download, Save, Trash2, History, ChevronRight, Share2, GitGraph, Maximize2, Minimize2, Copy, Check, FileText, X, Plus, BrainCircuit, Wand2, Database, Upload } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useNotificationStore } from '../store/useNotificationStore';
import { useFlowChartStore } from '../store/useFlowChartStore';
import { useUploadStore } from '../store/useUploadStore';
import UploadToCoursesModal from '../components/UploadToCoursesModal';
import { useAuthStore } from '../store/useAuthStore';
import { InteractiveTree } from '../components/InteractiveTree';
import CinematicLoader from '../components/CinematicLoader';
import mermaid from 'mermaid';
import { useLocation } from 'react-router-dom';
import { DashboardFileSelector } from '../components/DashboardFileSelector';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
});

export default function FlowChart() {
  const { 
    query, generatedCode, interactiveData, loading, model, chartType, savedCharts, sourceFile,
    setQuery, setGeneratedCode, setModel, setChartType, generateFlowChart, saveCurrentChart, deleteChart, loadChart, setSourceFile
  } = useFlowChartStore();
  
  const addNotification = useNotificationStore(state => state.addNotification);
  const { addUpload } = useUploadStore();
  const { role } = useAuthStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [dashboardFiles, setDashboardFiles] = useState<any[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [isPromptBuilding, setIsPromptBuilding] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData, autoFillQuery } = location.state;
      const autoQuery = autoFillQuery || `Create a ${chartType} for: ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Include: ${extractedData?.keyConcepts?.join(', ') || ''}`;
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
          useFlowChartStore.getState().setQuery(autoQuery);
          useFlowChartStore.getState().generateFlowChart(apiKey);
        }
      }, 500);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (generatedCode && chartRef.current) {
      chartRef.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [generatedCode]);

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
      setShowDashboardSelector(false);
    } catch (error) {
      console.error('Error processing dashboard file:', error);
      addNotification('error', 'Failed to process selected file');
    }
  };

  const handlePromptBuild = async () => {
    if (!query.trim()) {
      addNotification('info', 'Please enter a simple topic first (e.g., Electrolysis)');
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
        contents: `Act as an expert educational prompt engineer. Convert the following simple topic into a detailed, structured, and classroom-friendly AI prompt for generating a high-quality ${chartType} (diagram, flowchart, or mind map). 
        Topic: "${query}"
        The output should be a single detailed prompt that includes key concepts, logical flow, relationships, and classroom-friendly formatting. 
        Return ONLY the prompt text.`,
      });

      if (response.text) {
        setQuery(response.text.trim());
        addNotification('success', 'Detailed prompt generated!');
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
      await generateFlowChart(apiKey);
    } catch (error) {
      console.error("Generation Error:", error);
      addNotification('error', 'Failed to generate flowchart. Please try again.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addNotification('success', 'Mermaid code copied to clipboard!');
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    const shareData = {
      title: `Smart Sunrise - ${query} ${chartType}`,
      text: `Check out this AI-generated ${chartType} for ${query}!`,
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

  const handleUploadToCourses = async (data: { class: string; subject: string }) => {
    if (!generatedCode) return;
    
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { background: #0f172a; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; }
        .mermaid { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        h1 { margin-bottom: 20px; font-size: 24px; }
    </style>
</head>
<body>
    <h1>${query}</h1>
    <div class="mermaid">
        ${generatedCode}
    </div>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${query.replace(/[^a-z0-9]/gi, '_')}_${chartType.replace(/[^a-z0-9]/gi, '_')}.html`, { type: 'text/html' });
      const contextStr = `title=${query} ${chartType}|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=${data.subject}|class=${data.class}|description=AI-generated ${chartType} for ${query}|fileType=HTML Diagram`;
      
      await addUpload(file, contextStr);
      addNotification('success', `${chartType} uploaded to courses successfully!`);
    } catch (error) {
      addNotification('error', `Failed to upload ${chartType}.`);
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            <GitGraph className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              AI Diagram <span className="text-gradient">& Concept Map</span>
            </h2>
            <p className="text-gray-400">Transform complex concepts into logical AI-powered diagrams, mind maps, and interactive concept maps</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setChartType('Concept Map')}
            className={`px-4 py-2 rounded-xl transition-all border ${chartType === 'Concept Map' ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            Concept Map
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
          >
            <History className="w-4 h-4" />
            History
          </button>
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
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Diagram Type</label>
              <select 
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="Concept Map">Concept Map</option>
                <option value="Flowchart">Flowchart</option>
                <option value="Mind Map">Mind Map</option>
                <option value="Sequence Diagram">Sequence Diagram</option>
                <option value="State Diagram">State Diagram</option>
                <option value="Cheat Sheet (Class Diagram)">Cheat Sheet</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Concept / Process</label>
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
                <GrammarTextarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Photosynthesis process, How a computer boots up, The water cycle..."
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
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Device</span>
                </button>
                <button
                  onClick={() => {
                    setShowDashboardSelector(true);
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
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Generating...' : `Generate ${chartType}`}
              </button>
            </div>
          </div>

          {/* History Sidebar (Mobile/Desktop) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Recent Charts</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {savedCharts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm italic">No saved charts yet</div>
                  ) : (
                    savedCharts.map(chart => (
                      <div key={chart.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group flex items-center justify-between">
                        <button 
                          onClick={() => loadChart(chart)}
                          className="flex-1 text-left truncate mr-2"
                        >
                          <p className="text-sm font-medium text-white truncate">{chart.title}</p>
                          <p className="text-[10px] text-gray-500">{new Date(chart.timestamp).toLocaleDateString()}</p>
                        </button>
                        <button 
                          onClick={() => deleteChart(chart.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Display Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`relative glass-panel rounded-2xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col ${isFullscreen ? 'fixed inset-0 z-[1000] rounded-none bg-[#050505]' : ''}`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="ml-2 text-xs font-mono text-gray-500 uppercase tracking-widest">Diagram_Output</span>
              </div>
              
              <div className="flex items-center gap-2">
                {generatedCode && (
                  <>
                    <button 
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-all"
                      title="Share Diagram"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={saveCurrentChart}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-all"
                      title="Save to History"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/30 transition-all text-sm font-bold"
                    >
                      <Upload className="w-4 h-4" />
                      Upload to Courses
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
                      <span>Synthesizing Knowledge Structure...</span>
                      <span>{query ? 'Analyzing Topic' : 'Processing Source'}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 10, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF]"
                      />
                    </div>
                  </div>
                </div>
              ) : interactiveData ? (
                <InteractiveTree data={interactiveData} />
              ) : generatedCode ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div 
                    ref={chartRef} 
                    className="mermaid w-full flex justify-center"
                    style={{ minHeight: '400px' }}
                  >
                    {generatedCode}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                    <GitGraph className="w-10 h-10 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-gray-500">No Diagram Generated</h3>
                    <p className="text-gray-600 max-w-xs mx-auto">Enter a process or concept in the sidebar to generate a logical flowchart.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard File Selector Modal */}
      <DashboardFileSelector 
        isOpen={showDashboardSelector}
        onClose={() => setShowDashboardSelector(false)}
        onSelect={handleDashboardFileSelect}
      />

      {/* Upload to Courses Modal */}
      <UploadToCoursesModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadToCourses}
      />
    </motion.div>
  );
}
