import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BrainCircuit, MonitorPlay, GitGraph, FileText, CheckCircle, Loader2, Play, Eye, Zap, List, HelpCircle, FileQuestion, BookOpen } from 'lucide-react';
import { useCoPilotStore } from '../store/useCoPilotStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { analyzeContentForCoPilot, CoPilotSuggestion } from '../services/aiCoPilotService';
import { useNavigate } from 'react-router-dom';

const toolIcons: Record<string, any> = {
  'visualizer': Sparkles,
  'simulator': MonitorPlay,
  'flowchart': GitGraph,
  'practice': BrainCircuit,
  'diagram': Zap,
  'solution': HelpCircle,
  'quiz': FileQuestion,
  'summary': BookOpen,
  'board': FileText,
};

const toolRoutes: Record<string, string> = {
  'visualizer': '/visualizer',
  'simulator': '/simulator',
  'flowchart': '/flowchart',
  'practice': '/practice',
  'diagram': '/flowchart',
  'solution': '/practice',
  'quiz': '/practice',
  'summary': '/practice',
  'board': '/practice',
};

export default function AutoSuggestModal() {
  const { isModalOpen, selectedContent, closeModal, extractedData, setExtractedData, isAnalyzing, setIsAnalyzing } = useCoPilotStore();
  const navigate = useNavigate();
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    if (isModalOpen && selectedContent && !extractedData) {
      const fetchAnalysis = async () => {
        setIsAnalyzing(true);
        const meta = selectedContent.context?.custom || {};
        const title = meta.title || selectedContent.public_id;
        
        let apiKey = '';
        if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
          apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        }

        if (!apiKey) {
          console.error("AutoSuggest: Gemini API Key missing.");
          setIsAnalyzing(false);
          return;
        }

        try {
          console.log("AutoSuggest: Starting analysis for", title);
          // Fetch content first if it's a URL
          let contentToAnalyze = selectedContent.secure_url;
          
          // Try to fetch text content if possible (for text-based files)
          const isTextFile = selectedContent.format === 'txt' || selectedContent.format === 'json' || selectedContent.format === 'md';
          
          if (isTextFile) {
            try {
              const response = await fetch(`/api/proxy?url=${encodeURIComponent(selectedContent.secure_url)}`);
              if (response.ok) {
                contentToAnalyze = await response.text();
                console.log("AutoSuggest: Successfully fetched text content");
              }
            } catch (e) {
              console.warn("AutoSuggest: Could not fetch raw content, passing URL instead", e);
            }
          }

          const data = await analyzeContentForCoPilot(contentToAnalyze, title, apiKey);
          console.log("AutoSuggest: Analysis successful", data);
          setExtractedData(data);
        } catch (error) {
          console.error("AutoSuggest: Analysis failed", error);
          // Set a minimal fallback data if it fails completely
          setExtractedData({
            topic: title,
            keyConcepts: ["Educational Content"],
            formulas: [],
            definitions: [],
            diagrams: [],
            experimentReferences: [],
            suggestions: [
              { toolName: "Practice Questions", description: "Generate practice questions from this content", toolId: "practice", previewIcon: "BrainCircuit", autoFillQuery: `Generate practice questions for: ${title}` },
              { toolName: "Concept Map", description: "Create a visual flowchart of the concepts", toolId: "flowchart", previewIcon: "GitGraph", autoFillQuery: `Create a flowchart for: ${title}` },
              { toolName: "Summary", description: "Get a concise summary of the key points", toolId: "summary", previewIcon: "BookOpen", autoFillQuery: `Summarize the content: ${title}` }
            ]
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      fetchAnalysis();
    }
  }, [isModalOpen, selectedContent, extractedData]);

  if (!isModalOpen) return null;

  const handleGenerate = (suggestion: CoPilotSuggestion) => {
    const route = toolRoutes[suggestion.toolId] || '/';
    navigate(route, { state: { sourceContent: selectedContent, extractedData, autoFillQuery: suggestion.autoFillQuery } });
    closeModal();
  };

  const handleGenerateAll = async () => {
    if (!extractedData || !selectedContent) return;
    
    setGeneratingAll(true);
    
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      console.error("AutoSuggest: Gemini API Key missing.");
      setGeneratingAll(false);
      return;
    }

    const { startGeneration } = useGenerationStore.getState();
    const contentId = selectedContent.public_id;

    // Trigger all suggestions in background
    const promises = extractedData.suggestions.map((suggestion: CoPilotSuggestion) => {
      return startGeneration(contentId, suggestion.toolId, suggestion.autoFillQuery, apiKey);
    });

    // We don't necessarily need to wait for all of them to finish here, 
    // but waiting a bit to show progress is fine.
    // The store will handle the background execution.
    
    setGeneratingAll(false);
    closeModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel rounded-3xl p-6 md:p-8 w-full max-w-4xl relative z-10 border border-transparent shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Animated Neon Border */}
          <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00F0FF] animate-gradient-xy pointer-events-none z-50" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 to-[#B026FF]/10 pointer-events-none"></div>
          
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6 relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#00F0FF]" />
                AI Classroom Co-Pilot Suggestions
              </h2>
              <p className="text-gray-400 text-sm">Intelligent suggestions based on your uploaded content</p>
            </div>
            
            {extractedData && (
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll}
                className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-black font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                {generatingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Generate All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pr-2">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative w-16 h-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-dashed border-[#00F0FF]/50" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-2 border-[#B026FF]/50" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
                </div>
                <p className="text-[#00F0FF] font-mono text-sm animate-pulse">Analyzing Content Structure...</p>
              </div>
            ) : extractedData ? (
              <div className="space-y-8">
                {/* Extracted Insights */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                  <h3 className="text-[#00F0FF] font-bold mb-3 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5" /> Extracted Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Detected Topic</span>
                      <p className="text-white font-medium">{extractedData.topic}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Key Concepts</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractedData.keyConcepts?.slice(0, 6).map((concept: string, i: number) => (
                          <span key={`${concept}-${i}`} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300">{concept}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestions Grid */}
                <div>
                  <h3 className="text-white font-bold mb-4 text-lg">Suggested Generations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedData.suggestions?.map((suggestion: CoPilotSuggestion, index: number) => {
                      const Icon = toolIcons[suggestion.toolId] || Sparkles;
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all group flex flex-col"
                        >
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00F0FF]/20 group-hover:border-[#00F0FF]/30 transition-colors shrink-0">
                              <Icon className="w-5 h-5 text-[#00F0FF]" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold">{suggestion.toolName}</h4>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{suggestion.description}</p>
                            </div>
                          </div>
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                            <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                              <Eye className="w-3 h-3" /> Preview
                            </button>
                            <button 
                              onClick={() => handleGenerate(suggestion)}
                              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] text-sm font-medium transition-colors border border-transparent hover:border-[#00F0FF]/30"
                            >
                              Generate
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>Failed to analyze content.</p>
              </div>
            )}
          </div>
          
          {extractedData && (
            <div className="mt-6 pt-4 border-t border-white/10 md:hidden">
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-black font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generatingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Generate All
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
