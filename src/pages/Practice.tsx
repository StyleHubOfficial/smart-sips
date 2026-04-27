import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GrammarTextarea } from '../components/GrammarTextarea';
import { Search, BookOpen, CheckCircle, XCircle, HelpCircle, Loader2, Save, BrainCircuit, LayoutGrid, List, Square, Sparkles, Plus, FileText, X, Activity, Timer, Presentation, LayoutPanelLeft, ChevronLeft, ChevronRight, Maximize2, History, Upload, Database, Pause, Play, ExternalLink, Link2, Clock, Trash2, RotateCcw, Copy, ChevronDown, Award, Wand2, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { usePracticeStore, Question } from '../store/usePracticeStore';
import { useUploadStore } from '../store/useUploadStore';
import CinematicLoader from '../components/CinematicLoader';
import Whiteboard from '../components/Whiteboard';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGenerationStore } from '../store/useGenerationStore';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from '@google/genai';
import { BackButton } from '../components/BackButton';
import { QuestionExporter } from '../components/QuestionExporter';
import { DashboardFileSelector } from '../components/DashboardFileSelector';
import UploadToCoursesModal from '../components/UploadToCoursesModal';

export default function Practice() {
  const { 
    query, questionCount, subject, examType, classLevel, model, viewMode, difficulty, isPYQ, pyqYear, questionType, examFormat, isSmartPanelMode, sourceFiles, questions, loading, selectedOptions, showSolutions, showHints, showSourceLinks, stepReveals, analysis, analyzing, whiteboardMode,
    isSourceConverterMode, dppMode, mixUp, sequenceWise,
    setQuery, setQuestionCount, setSubject, setExamType, setClassLevel, setModel, setViewMode, setDifficulty, setIsPYQ, setPyqYear, setQuestionType, setExamFormat, setIsSmartPanelMode, setSourceFiles, setSelectedOption, setShowHint, setShowSolution, setShowSourceLinks, setStepReveal, generateQuestions, generateNextQuestions, generateSimilarQuestions, analyzeScore, setWhiteboardMode,
    setIsSourceConverterMode, setDppMode, setMixUp, setSequenceWise
  } = usePracticeStore();
  
  const { role } = useAuthStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  const { addUpload, uploads } = useUploadStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideModeConfig, setSlideModeConfig] = useState<{ questionsPerSlide: 1 | 2, overlay: boolean }>({ questionsPerSlide: 1, overlay: false });
  const [slideWhiteboardData, setSlideWhiteboardData] = useState<Record<number, string>>({});
  const [sideWhiteboardData, setSideWhiteboardData] = useState<string | undefined>(undefined);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [sideWhiteboardWidth, setSideWhiteboardWidth] = useState(() => {
    const saved = localStorage.getItem('sunrise_side_whiteboard_width');
    return saved ? Number(saved) : 50;
  }); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dashboardFiles, setDashboardFiles] = useState<any[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [isPromptBuilding, setIsPromptBuilding] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [targetTimerSeconds, setTargetTimerSeconds] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadContent, setUploadContent] = useState<{ title: string; content: string; type: string } | null>(null);
  const [generationMode, setGenerationMode] = useState<'live' | 'last'>('live');
  const [showSimilarModal, setShowSimilarModal] = useState<{questionId: string, type: 'ai' | 'pyq' | 'search'} | null>(null);
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);
  const [nextQuestionCount, setNextQuestionCount] = useState(10);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [version] = useState("Advance 2.5x");
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { tasks } = useGenerationStore();

  useEffect(() => {
    // Check if there's a background generation task for Practice
    const practiceTask = tasks.find(t => t.toolId === 'practice' && t.status === 'completed');
    if (practiceTask && questions.length === 0) {
      const parsedQuestions = typeof practiceTask.result === 'string' ? JSON.parse(practiceTask.result) : practiceTask.result;
      usePracticeStore.getState().setQuestions(parsedQuestions);
    }
  }, [tasks, questions]);

  const handleUploadReport = () => {
    const score = questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length;
    const accuracy = (score / questions.length) * 100;
    
    // Create a structured report for upload
    const reportContent = `
# Practice Session Report
**Topic:** ${query}
**Subject:** ${subject}
**Exam Type:** ${examType}
**Score:** ${score} / ${questions.length}
**Accuracy:** ${accuracy.toFixed(1)}%
**Time Taken:** ${formatTime(timerSeconds)}

## Questions & Answers
${questions.map((q, i) => `
### Question ${i + 1}
${q.question}
**Your Answer:** ${selectedOptions[q.id] || 'Not Answered'}
**Correct Answer:** ${q.correctAnswer}
**Status:** ${selectedOptions[q.id] === q.correctAnswer ? '✅ Correct' : '❌ Incorrect'}
`).join('\n')}

${analysis ? `## AI Analysis\n${JSON.stringify(analysis, null, 2)}` : ''}
    `;

    setUploadContent({
      title: `Practice: ${query || 'Session'} (${new Date().toLocaleDateString()})`,
      content: reportContent,
      type: 'practice_report'
    });
    setShowUploadModal(true);
  };

  const Scorecard = ({ score, total, accuracy, timeTaken }: { score: number, total: number, accuracy: number, timeTaken: number }) => {
    const avgSpeed = score > 0 ? Math.round(timeTaken / total) : 0;
    const [displayScore, setDisplayScore] = useState(0);
    const [displayAccuracy, setDisplayAccuracy] = useState(0);

    const getFeedback = (acc: number) => {
      if (acc >= 95) return { emoji: "🏆", reaction: "Superb", color: "text-yellow-400" };
      if (acc >= 85) return { emoji: "🌟", reaction: "Outstanding", color: "text-[#00F0FF]" };
      if (acc >= 75) return { emoji: "✨", reaction: "Perfect", color: "text-[#B026FF]" };
      if (acc >= 70) return { emoji: "🎯", reaction: "Excellent", color: "text-emerald-400" };
      if (acc >= 60) return { emoji: "✅", reaction: "Well done", color: "text-green-400" };
      if (acc >= 50) return { emoji: "😊", reaction: "Good", color: "text-blue-400" };
      if (acc >= 30) return { emoji: "👍", reaction: "Need improvement", color: "text-orange-400" };
      return { emoji: "📚", reaction: "Practice more", color: "text-red-400" };
    };

    const feedback = getFeedback(accuracy);

    useEffect(() => {
      let start = 0;
      const duration = 1500; // 1.5 seconds
      const startTime = performance.now();

      const animateScore = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        setDisplayScore(Math.round(easeProgress * score));
        setDisplayAccuracy(Math.round(easeProgress * accuracy));

        if (progress < 1) {
          requestAnimationFrame(animateScore);
        }
      };

      requestAnimationFrame(animateScore);
    }, [score, accuracy]);
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-4xl mx-auto space-y-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Accuracy</div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                <motion.circle 
                  cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={226}
                  initial={{ strokeDashoffset: 226 }}
                  animate={{ strokeDashoffset: 226 - (226 * accuracy) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-[#00F0FF]"
                />
              </svg>
              <span className="absolute text-xl font-bold text-white">{displayAccuracy}%</span>
            </div>
            <div className={`text-2xl mt-2 flex flex-col items-center gap-1`}>
              <span>{feedback.emoji}</span>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${feedback.color}`}>{feedback.reaction}</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Score</div>
            <div className="text-3xl font-display font-bold text-[#B026FF]">{displayScore} / {total}</div>
            <div className="text-[10px] text-gray-500 mt-1">Questions Correct</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time Taken</div>
            <div className="text-3xl font-display font-bold text-[#FFD600]">{formatTime(timeTaken)}</div>
            <div className="text-[10px] text-gray-500 mt-1">Total Duration</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avg. Speed</div>
            <div className="text-3xl font-display font-bold text-emerald-400">{avgSpeed}s</div>
            <div className="text-[10px] text-gray-500 mt-1">Per Question</div>
          </div>
        </div>

        {!analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all flex items-center gap-3 group"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Performance...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Analyze Performance
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const DetailedAnalysis = ({ data }: { data: any }) => {
    if (!data) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto space-y-6"
      >
        <div className="glass-panel p-8 rounded-3xl border border-[#00F0FF]/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F0FF] to-[#B026FF]" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Performance Analysis</h3>
              <p className="text-gray-400 text-sm">Personalized feedback based on your responses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Key Strengths
                </h4>
                <ul className="space-y-2">
                  {data.strengths?.map((s: string, i: number) => (
                    <li key={`strength-${s}-${i}`} className="flex items-start gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {data.weaknesses?.map((w: string, i: number) => (
                    <li key={`weakness-${w}-${i}`} className="flex items-start gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-bold text-[#FFD600] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Suggestion
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                  "{data.suggestion}"
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#B026FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" /> Recommended Practice
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.recommendedQuestions?.map((q: string, i: number) => (
                    <button 
                      key={`rec-${i}`}
                      onClick={() => {
                        setQuery(`Generate practice questions for: ${q}`);
                        setPracticeFinished(false);
                        handleSearch();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/20 text-[#B026FF] text-xs font-bold hover:bg-[#B026FF]/20 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleFinishPractice = async () => {
    setIsTimerRunning(false);
    setPracticeFinished(true);
    
    const score = questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length;
    const percentage = (score / questions.length) * 100;

    if (percentage >= 70) {
      setShowCelebration(true);
      triggerConfetti();
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const handleStartAnalysis = async () => {
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing for analysis');
      return;
    }

    await analyzeScore(apiKey);
  };

  useEffect(() => {
    if (questions.length > 0 && Object.keys(selectedOptions).length === questions.length) {
      const score = questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length;
      const percentage = (score / questions.length) * 100;
      if (percentage >= 70 && !showCelebration) {
        setShowCelebration(true);
        triggerConfetti();
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  }, [selectedOptions, questions]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00F0FF', '#B026FF', '#FFD600']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00F0FF', '#B026FF', '#FFD600']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (targetTimerSeconds > 0 && prev >= targetTimerSeconds) {
            setIsTimerRunning(false);
            addNotification('info', 'Timer reached target time!');
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, targetTimerSeconds]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    localStorage.setItem('sunrise_side_whiteboard_width', sideWhiteboardWidth.toString());
  }, [sideWhiteboardWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setSideWhiteboardWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (whiteboardMode !== 'none') {
      setShowFullscreenPrompt(true);
      const timer = setTimeout(() => setShowFullscreenPrompt(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [whiteboardMode]);

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData, autoFillQuery } = location.state;
      const autoQuery = autoFillQuery || `Create practice questions for: ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Focus on: ${extractedData?.keyConcepts?.join(', ') || ''}`;
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
          usePracticeStore.getState().setQuery(autoQuery);
          usePracticeStore.getState().generateQuestions(apiKey);
        }
      }, 500);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Check if there's an ongoing upload for this specific practice set
  const fallbackTitle = query || (sourceFiles.length > 0 ? sourceFiles[0].name : 'Practice Set');
  const isSaving = uploads.some(u => u.status === 'uploading' && u.contextStr.includes(`title=${fallbackTitle} Practice Set`));

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

  const handleSelectFromDashboard = async () => {
    setShowDashboardSelector(true);
    await fetchDashboardFiles();
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
        contents: `Act as an expert educational prompt engineer. Convert the following simple topic into a clear, concise, and on-point AI prompt for generating high-quality practice questions or teaching material. 
        Topic: "${query}"
        The output should be a single, focused prompt that specifies the core concepts, the type of questions needed, and the main educational goal. Do NOT make it overly detailed or wide-ranging. Keep it strictly relevant to the topic.
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: { name: string, data: string, mimeType: string }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        addNotification('error', `File ${file.name} is too large (max 5MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        newFiles.push({
          name: file.name,
          data: base64String,
          mimeType: file.type || 'text/plain'
        });
        
        if (newFiles.length === files.length) {
          setSourceFiles([...sourceFiles, ...newFiles]);
          addNotification('success', `${files.length} file(s) attached successfully`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSourceFile = (index: number) => {
    const updatedFiles = [...sourceFiles];
    updatedFiles.splice(index, 1);
    setSourceFiles(updatedFiles);
  };

  const handleGenerateNext = async () => {
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment variables.');
      return;
    }

    setIsGeneratingNext(true);
    try {
      await generateNextQuestions(apiKey, nextQuestionCount, (qs) => {
        console.log(`Streamed ${qs.length} total questions`);
      });
    } catch (error) {
      console.error("Next Generation Error:", error);
      addNotification('error', 'Failed to generate next questions. Please try again.');
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleSearch = async () => {
    if (isSourceConverterMode && sourceFiles.length === 0) {
      addNotification('error', 'Please select at least one source file first');
      return;
    }
    if (!isSourceConverterMode && !query.trim()) return;
    
    // Robust API Key Retrieval for Vercel & Preview Environments
    let apiKey = '';
    
    // 1. Try process.env (Preview Environment / Define Plugin)
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    // 2. Try import.meta.env (Standard Vite / Vercel)
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment variables.');
      return;
    }

    try {
      await generateQuestions(apiKey, (qs) => {
        // Optional: handle each chunk if needed, but the store already updates questions
        console.log(`Streamed ${qs.length} questions`);
      });
    } catch (error) {
      console.error("Generation Error:", error);
      addNotification('error', 'Failed to generate questions. Please check your API key and try again.');
    }
  };

  const handleGenerateSimilar = async (question: Question, type: 'ai' | 'pyq' | 'search') => {
    let apiKey = '';
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      addNotification('error', 'API Key missing');
      return;
    }

    setIsGeneratingSimilar(true);
    try {
      await generateSimilarQuestions(apiKey, question, type);
      addNotification('success', 'Similar questions generated');
    } catch (error) {
      console.error("Similar generation error:", error);
      addNotification('error', 'Failed to generate similar questions');
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const handleOptionClick = (questionId: string, option: string) => {
    if (selectedOptions[questionId]) return;
    setSelectedOption(questionId, option);
  };

  const handleUploadPracticeSet = async () => {
    if (questions.length === 0) return;
    
    const fallbackTitle = query || (sourceFiles.length > 0 ? sourceFiles[0].name : 'Practice Set');
    const safeTitle = fallbackTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 20);

    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fallbackTitle} Practice Set</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #e5e7eb; max-width: 800px; margin: 0 auto; padding: 20px; background: #0f172a; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #334155; }
        .question-card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
        .question-text { font-size: 1.125rem; font-weight: 600; margin-bottom: 16px; color: #f8fafc; }
        .options-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .options-grid { grid-template-columns: 1fr 1fr; } }
        .option-btn { text-align: left; padding: 12px 16px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: #e5e7eb; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; width: 100%; }
        .option-btn:hover:not(:disabled) { background: #334155; border-color: #475569; }
        .option-btn:disabled { cursor: default; }
        .option-btn.correct { background-color: rgba(34, 197, 94, 0.2) !important; border-color: rgba(34, 197, 94, 0.5) !important; color: #86efac !important; font-weight: 600; }
        .option-btn.incorrect { background-color: rgba(239, 68, 68, 0.2) !important; border-color: rgba(239, 68, 68, 0.5) !important; color: #fca5a5 !important; }
        .solution { margin-top: 16px; padding: 16px; background: rgba(0, 240, 255, 0.05); border-radius: 8px; border: 1px solid rgba(0, 240, 255, 0.2); display: none; color: #cbd5e1; }
        .solution.visible { display: block; animation: fadeIn 0.3s ease-in-out; }
        .solution-title { font-weight: 600; color: #00F0FF; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .source-link { display: inline-block; margin-top: 12px; font-size: 0.875rem; color: #38bdf8; text-decoration: none; border-top: 1px solid #334155; padding-top: 8px; width: 100%; }
        .source-link:hover { text-decoration: underline; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${fallbackTitle} Practice Set</h1>
        <p>Generated by Smart Sunrise AI • ${questions.length} Questions • ${subject} • ${examType} • ${classLevel}</p>
    </div>

    <div id="questions-container">
        ${questions.map((q, i) => `
        <div class="question-card" id="q-${i}">
            <div class="question-text">${i + 1}. ${q.question}</div>
            <div class="options-grid">
                ${q.options.map((opt) => `
                <button class="option-btn" onclick="checkAnswer(${i}, '${opt.replace(/'/g, "\\'")}', this)">${opt}</button>
                `).join('')}
            </div>
            <div class="solution" id="sol-${i}">
                <div class="solution-title">📝 Solution</div>
                <p>${q.solution}</p>
                ${q.sourceLink ? `<a href="${q.sourceLink}" target="_blank" class="source-link">View Source</a>` : ''}
            </div>
            <input type="hidden" id="ans-${i}" value="${q.correctAnswer.replace(/"/g, '&quot;')}">
        </div>
        `).join('')}
    </div>

    <script>
        function checkAnswer(qIndex, selectedOption, btnElement) {
            const container = document.getElementById('q-' + qIndex);
            const correctAnswer = document.getElementById('ans-' + qIndex).value;
            const solution = document.getElementById('sol-' + qIndex);
            const buttons = container.querySelectorAll('.option-btn');
            
            // Disable all buttons in this question
            buttons.forEach(btn => {
                btn.disabled = true;
                if (btn.innerText === correctAnswer) {
                    btn.classList.add('correct');
                } else if (btn === btnElement && selectedOption !== correctAnswer) {
                    btn.classList.add('incorrect');
                }
            });

            // Show solution
            solution.classList.add('visible');
        }
    </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${safeTitle}_practice_set.html`, { type: 'text/html' });

      const contextStr = `title=${fallbackTitle} Practice Set|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=${subject}|class=${classLevel}|description=Interactive practice questions for ${fallbackTitle} (${questionCount} Qs) - ${examType}|fileType=HTML Quiz`;
      
      // Start background upload
      addUpload(file, contextStr);
      
      addNotification('info', 'Saving practice set in background...');
      setIsSaved(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving practice set:', error);
      addNotification('error', 'Failed to save practice set.');
    }
  };

  const renderQuestionCard = (q: any, index: number, compact = false) => {
    const isSheetMode = dppMode === 'sheet';
    
    return (
      <motion.div
        key={`q-card-${q.id}-${index}-${compact ? 'compact' : 'full'}`}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: Math.min(index * 0.05, 0.2) }}
        className={`
          ${isSheetMode 
            ? 'bg-white text-black p-8 shadow-none print:break-inside-avoid' 
            : `glass-panel rounded-2xl p-6 border border-white/10 ${viewMode === 'triple' && !compact ? 'h-full' : ''} ${isSmartPanelMode && !compact ? 'scale-[1.02] shadow-2xl' : ''} ${compact ? 'bg-transparent border-none p-0 shadow-none' : ''}`
          }
          flex flex-col relative
        `}
      >
        {isSheetMode && (
          <div className="absolute top-8 right-8 text-[10px] text-gray-400 font-mono uppercase tracking-widest">
            Q-{index + 1}
          </div>
        )}
        {!isSheetMode && (
          <div className="flex flex-wrap gap-2 mb-4">
            {q.difficultyBadge && (
              <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-medium text-gray-300 border border-white/10">
                {q.difficultyBadge}
              </span>
            )}
            {q.topicTag && (
              <span className="px-2 py-1 rounded-md bg-[#00F0FF]/10 text-xs font-medium text-[#00F0FF] border border-[#00F0FF]/20">
                {q.topicTag}
              </span>
            )}
            {q.type && (
              <span className="px-2 py-1 rounded-md bg-[#B026FF]/10 text-xs font-medium text-[#B026FF] border border-[#B026FF]/20">
                {q.type}
              </span>
            )}
            {q.pyqYear && (
              <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-xs font-medium text-yellow-400 border border-yellow-500/20">
                {q.pyqYear}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${isSheetMode ? 'bg-black/5 text-black' : 'bg-white/5 text-[#00F0FF]'}`}>
            {index + 1}
          </div>
          <div className={`font-medium prose max-w-none prose-p:my-0 prose-pre:my-2 ${isSheetMode ? 'text-black prose-black' : 'text-white prose-invert prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10'} ${isSmartPanelMode ? 'text-2xl' : 'text-lg'}`}>
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question}</Markdown>
          </div>
        </div>
      
      {q.options && q.options.length > 0 && (
        <div className={`grid gap-3 mb-4 ${viewMode === 'triple' && !compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {q.options.map((option: string, optIndex: number) => {
              const isSelected = selectedOptions[q.id] === option;
              const isCorrect = q.correctAnswer === option;
              const showResult = !!selectedOptions[q.id];
              
              if (isSheetMode) {
                return (
                  <div key={`${q.id}-opt-${optIndex}`} className="flex items-start gap-3 p-3 text-gray-700 text-sm border border-gray-100 rounded-lg">
                    <span className="font-bold text-black/30">{String.fromCharCode(65 + optIndex)}.</span>
                    <div className="prose prose-black max-w-none prose-p:my-0 prose-pre:my-0">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</Markdown>
                    </div>
                  </div>
                );
              }
            
            let optionClass = "bg-white/5 border-white/10 hover:bg-white/10";
            if (showResult) {
              if (isCorrect) optionClass = "bg-green-500/20 border-green-500/50 text-green-200";
              else if (isSelected) optionClass = "bg-red-500/20 border-red-500/50 text-red-200";
              else optionClass = "bg-white/5 border-white/10 opacity-50";
            }

            return (
              <motion.button
                whileHover={!showResult ? { scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                animate={showResult && isSelected ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.3 }}
                key={`${q.id}-opt-${optIndex}`}
                onClick={() => handleOptionClick(q.id, option)}
                disabled={showResult}
                className={`w-full text-left p-3 rounded-xl border transition-colors duration-300 flex items-center justify-between group text-sm ${optionClass} ${isSmartPanelMode ? 'text-lg p-4' : ''}`}
              >
                <div className="prose prose-invert max-w-none prose-p:my-0 prose-pre:my-0">
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</Markdown>
                </div>
                {showResult && isCorrect && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 ml-2" />
                  </motion.div>
                )}
                {showResult && isSelected && !isCorrect && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 ml-2" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

        {(!q.options || q.options.length === 0) && !isSheetMode && (
          <div className="mb-4">
            <button 
              onClick={() => handleOptionClick(q.id, q.correctAnswer)}
              disabled={!!selectedOptions[q.id]}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-sm border border-white/10"
            >
              {selectedOptions[q.id] ? 'Answer Submitted' : 'Mark as Attempted'}
            </button>
          </div>
        )}

        {!isSheetMode && (
          <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
            {q.hint && (
              <button 
                onClick={() => setShowHint(q.id, !showHints[q.id])}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${showHints[q.id] ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'}`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHints[q.id] ? 'Hide Hint' : 'Show Hint'}
              </button>
            )}
            <button 
              onClick={() => setShowSolution(q.id, !showSolutions[q.id])}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${showSolutions[q.id] ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 hover:bg-[#00F0FF]/20'}`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {showSolutions[q.id] ? 'Hide Solution' : 'Show Solution'}
            </button>
            
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 ml-auto">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(q.question);
                  addNotification('success', 'Question copied to clipboard');
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Copy Question"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowSimilarModal(showSimilarModal?.questionId === q.id ? null : {questionId: q.id, type: 'ai'})}
                  className={`p-2 rounded-lg transition-colors ${isGeneratingSimilar ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-gray-400 hover:text-[#00F0FF]'}`} 
                  title="Similar Questions"
                  disabled={isGeneratingSimilar}
                >
                  {isGeneratingSimilar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {showSimilarModal?.questionId === q.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-2 flex flex-col bg-[#0f172a] border border-white/10 rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden"
                    >
                      <button onClick={() => { handleGenerateSimilar(q, 'ai'); setShowSimilarModal(null); }} className="px-4 py-2 text-[10px] text-gray-300 hover:bg-white/5 text-left flex items-center gap-2">
                        <BrainCircuit className="w-3.5 h-3.5" /> AI Similar
                      </button>
                      <button onClick={() => { handleGenerateSimilar(q, 'pyq'); setShowSimilarModal(null); }} className="px-4 py-2 text-[10px] text-gray-300 hover:bg-white/5 text-left flex items-center gap-2">
                        <History className="w-3.5 h-3.5" /> PYQ Similar
                      </button>
                      <button onClick={() => { handleGenerateSimilar(q, 'search'); setShowSimilarModal(null); }} className="px-4 py-2 text-[10px] text-gray-300 hover:bg-white/5 text-left flex items-center gap-2">
                        <Search className="w-3.5 h-3.5" /> Search Similar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  setSelectedOption(q.id, 'skipped');
                  addNotification('info', 'Question skipped');
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Skip Question"
              >
                <XCircle className="w-4 h-4" />
              </button>

              {showSourceLinks && q.sourceLink && (
                <a 
                  href={q.sourceLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-[#00F0FF] transition-colors"
                  title="View Source"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {isSheetMode && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-[10px] text-gray-400 font-medium">
              Smart Sunrise AI Generated Worksheet
            </div>
            <div className="flex gap-2">
              {q.topicTag && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.topicTag}</span>}
              {q.difficultyBadge && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.difficultyBadge}</span>}
            </div>
          </div>
        )}

        {!isSheetMode && showHints[q.id] && q.hint && (
          <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-sm text-yellow-200/80">
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.hint}</Markdown>
          </div>
        )}

        {!isSheetMode && (showSolutions[q.id] || (stepReveals[q.id] || 0) > 0) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#00F0FF]/5 border border-[#00F0FF]/20 rounded-xl p-4 mt-auto"
          >
          <div className="flex items-center gap-2 mb-2 text-[#00F0FF]">
            <HelpCircle className="w-4 h-4" />
            <span className="font-bold text-sm uppercase tracking-wider">Solution</span>
          </div>
          <div className="text-gray-300 text-sm leading-relaxed mb-3 prose prose-invert max-w-none prose-p:my-1 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
            {showSolutions[q.id] ? (
              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.solution}</Markdown>
            ) : (
              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {(() => {
                  // More robust splitting that handles various step formats
                  const steps = q.solution.split(/\n(?=\s*(?:\d+[\.\)]|Step|Phase|Part|•|\*))/i).filter(s => s.trim());
                  if (steps.length <= 1) {
                    // Fallback: split by sentences if no step markers found
                    const sentences = q.solution.split(/(?<=[.!?])\s+/);
                    return sentences.slice(0, (stepReveals[q.id] || 0) * 2).join(' ');
                  }
                  return steps.slice(0, stepReveals[q.id] || 0).join('\n\n');
                })()}
              </Markdown>
            )}
          </div>

          <button className="mt-2 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B026FF]/10 text-[#B026FF] border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI Explanation
          </button>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <span className="text-xs text-gray-400 mr-2">Generate Similar:</span>
            <button 
              disabled={isGeneratingSimilar}
              onClick={() => handleGenerateSimilar(q, 'ai')}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-2"
            >
              {isGeneratingSimilar ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
              AI Crafted
            </button>
            <button 
              disabled={isGeneratingSimilar}
              onClick={() => handleGenerateSimilar(q, 'pyq')}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors flex items-center gap-2"
            >
              {isGeneratingSimilar ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
              PYQs
            </button>
            <button 
              disabled={isGeneratingSimilar}
              onClick={() => handleGenerateSimilar(q, 'search')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
            >
              {isGeneratingSimilar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Real World
            </button>
          </div>

          {showSourceLinks && q.sourceLink && (
            <div className="text-xs text-gray-500 border-t border-white/10 pt-2 mt-3">
              Source: <a href={q.sourceLink} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline truncate inline-block max-w-full align-bottom">{q.sourceLink}</a>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-[1920px] 2xl:px-12 mx-auto pb-32"
    >
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
            <BrainCircuit className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              Practice <span className="text-gradient">Arena</span>
            </h2>
            <p className="text-gray-400">AI-powered question bank for competitive exams</p>
          </div>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden md:inline">Back to Dashboard</span>
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-8 w-full md:w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => {
            setIsPYQ(false);
            setSourceFiles([]);
            setIsSourceConverterMode(false);
          }}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${!isPYQ && !isSourceConverterMode ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
        >
          <Sparkles className="w-4 h-4" />
          DPP Generator
        </button>
        <button 
          onClick={() => {
            setIsPYQ(false);
            setIsSourceConverterMode(true);
          }}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${isSourceConverterMode ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white'}`}
        >
          <FileText className="w-4 h-4" />
          Source Converter
        </button>
      </div>

      {/* Search Section */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10 space-y-4 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00F0FF]/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Mode Specific Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${
              isPYQ ? 'bg-[#B026FF]/20 border-[#B026FF]/30 text-[#B026FF]' : 
              isSourceConverterMode ? 'bg-white/10 border-white/20 text-white' : 
              'bg-[#00F0FF]/20 border-[#00F0FF]/30 text-[#00F0FF]'
            } shadow-lg`}>
              {isPYQ ? <History className="w-6 h-6" /> : isSourceConverterMode ? <FileText className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {isPYQ ? 'PYQ Generator Mode' : isSourceConverterMode ? 'Source Converter Mode' : 'DPP Generator'}
              </h3>
              <p className="text-sm text-gray-400">
                {isPYQ ? 'Generate authentic previous year questions with search grounding' : 
                 isSourceConverterMode ? (sourceFiles.length > 0 ? `Converting ${sourceFiles.length} file(s) into practice questions` : 'Select a source to convert into questions') : 
                 'Create custom Daily Practice Problems (DPP) using advanced AI'}
              </p>
            </div>
          </div>
          
          {!isPYQ && !isSourceConverterMode && (
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
              <button 
                onClick={() => setDppMode('practice')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${dppMode === 'practice' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-500 hover:text-white'}`}
              >
                <Activity className="w-4 h-4" />
                Practice Mode
              </button>
              <button 
                onClick={() => setDppMode('sheet')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${dppMode === 'sheet' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-500 hover:text-white'}`}
              >
                <FileText className="w-4 h-4" />
                Sheet Mode
              </button>
            </div>
          )}
        </div>

        {/* Row 1: Filters */}
        {!isSourceConverterMode ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Class</label>
              <div className="relative group">
                <select 
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer group-hover:bg-white/5"
                >
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-[#00F0FF] transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
              <div className="relative group">
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer group-hover:bg-white/5"
                >
                  <option value="General">General</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Polity">Polity</option>
                  <option value="Economics">Economics</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-[#00F0FF] transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exam Type</label>
              <div className="relative group">
                <select 
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer group-hover:bg-white/5"
                >
                  <option value="General">General</option>
                  <option value="JEE Mains">JEE Mains</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET">NEET</option>
                  <option value="NDA">NDA</option>
                  <option value="CDS">CDS</option>
                  <option value="UPSC">UPSC</option>
                  <option value="SSC CGL">SSC CGL</option>
                  <option value="Bank PO">Bank PO</option>
                  <option value="GATE">GATE</option>
                  <option value="CAT">CAT</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-[#00F0FF] transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Difficulty</label>
              <div className="relative group">
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer group-hover:bg-white/5"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Board Level">Board Level</option>
                  <option value="Competition Level">Competition Level</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-[#00F0FF] transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sourceFiles.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-10 rounded-3xl border-2 border-dashed border-white/10 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-4 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF] group-hover:scale-110 transition-transform shadow-lg">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-white">Upload from Device</div>
                    <div className="text-sm text-gray-500">PDF, Images, or Text files</div>
                  </div>
                </button>
                <button 
                  onClick={handleSelectFromDashboard}
                  className="flex flex-col items-center justify-center gap-4 p-10 rounded-3xl border-2 border-dashed border-white/10 hover:border-[#B026FF]/50 hover:bg-[#B026FF]/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B026FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-4 rounded-2xl bg-[#B026FF]/10 text-[#B026FF] group-hover:scale-110 transition-transform shadow-lg">
                    <Database className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-white">Select from Dashboard</div>
                    <div className="text-sm text-gray-500">Use your previously uploaded files</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selected Sources ({sourceFiles.length})</h4>
                  <button 
                    onClick={() => setSourceFiles([])}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {sourceFiles.map((file, idx) => (
                    <div key={`source-item-${idx}`} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10 text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white max-w-[200px] truncate">{file.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest">Source Material</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeSourceFile(idx)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#00F0FF]" />
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#00F0FF]">Add More</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 2: Advanced Options */}
        <div className={`grid grid-cols-1 ${isSourceConverterMode ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 items-end`}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Type</label>
            <div className="relative group">
              <select 
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer group-hover:bg-white/5"
              >
                <option value="Mixed">Mixed</option>
                <option value="MCQ">MCQ</option>
                <option value="Integer Type">Integer Type</option>
                <option value="Assertion Reason">Assertion Reason</option>
                <option value="Numerical">Numerical</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Long Answer">Long Answer</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-[#00F0FF] transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {isSourceConverterMode && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Order</label>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                <button 
                  onClick={() => {
                    setSequenceWise(true);
                    setMixUp(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${sequenceWise ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-500 hover:text-white'}`}
                >
                  Sequential
                </button>
                <button 
                  onClick={() => {
                    setSequenceWise(false);
                    setMixUp(true);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mixUp ? 'bg-white/10 text-[#B026FF]' : 'text-gray-500 hover:text-white'}`}
                >
                  Mix Up
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Exam Format</label>
            <select 
              value={examFormat}
              onChange={(e) => setExamFormat(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="Board exam format">Board exam format</option>
              <option value="JEE style">JEE style</option>
              <option value="NEET style">NEET style</option>
              <option value="NDA style">NDA style</option>
              <option value="Concept practice">Concept practice</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="gemma-2-2b-it">Gemma 4 (New & Smart) ✨</option>
              <option value="gemini-3-flash-preview">High Quality (G3 Flash)</option>
              <option value="gemini-2.5-flash">Medium Quality (G2.5 Flash)</option>
              <option value="gemini-3.1-flash-lite-preview">Fast (G3.1 Lite)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">No. of Questions ({questionCount})</label>
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Row 3: Smart Panel */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
          {isPYQ && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Year:</label>
              <select 
                value={pyqYear}
                onChange={(e) => setPyqYear(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="Custom range">Custom range</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input 
              type="checkbox" 
              checked={showSourceLinks}
              onChange={(e) => setShowSourceLinks(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-black/40 text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-white">Source Links</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={isSmartPanelMode}
              onChange={(e) => setIsSmartPanelMode(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-black/40 text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-white">Smart Panel Mode</span>
          </label>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center pt-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.txt,.csv,.json,.md"
          />
      <div className="relative w-full">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Topic & Focus</label>
        <GrammarTextarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={isSourceConverterMode ? (sourceFiles.length > 0 ? `Describe how to convert ${sourceFiles[0].name}...` : 'Select a source first') : `e.g. Newtonian mechanics focusing on application problems...`}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-6 pr-16 text-white text-base md:text-lg focus:outline-none focus:border-[#00F0FF]/50 transition-all resize-none h-[120px]"
        />
        <button 
          onClick={async () => {
            if (!query.trim()) {
              setQuery(`Generate ${questionCount} ${subject !== 'General' ? subject : 'General'} questions on [Enter Topic Here] focusing on application problems suitable for ${examType} level.`);
              addNotification('info', 'Fill in the topic inside the brackets.');
              return;
            }
            handlePromptBuild();
          }}
          disabled={isPromptBuilding}
          className="absolute right-3 top-10 p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-all disabled:opacity-30"
          title="Enhance Prompt (AI)"
        >
          {isPromptBuilding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
        </button>
      </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSearch}
            disabled={loading || (isSourceConverterMode ? sourceFiles.length === 0 : !query.trim())}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {loading && questions.length === 0 && (
          <div className="py-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-3 flex-1">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-white/5 rounded-xl border border-white/10" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Generated Questions <span className="text-gray-500 text-sm font-normal">({questions.length})</span>
            </h3>
            
            {/* Redundant analysis block removed in favor of the new Finish & Analyze flow */}
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWhiteboardMode(whiteboardMode === 'side' ? 'none' : 'side')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${whiteboardMode === 'side' ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
              >
                <LayoutPanelLeft className="w-5 h-5" />
                Open Whiteboard in Side
              </button>
              <button
                onClick={() => setWhiteboardMode(whiteboardMode === 'slide' ? 'none' : 'slide')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${whiteboardMode === 'slide' ? 'bg-[#B026FF] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
              >
                <Presentation className="w-5 h-5" />
                Open Questions with Whiteboard
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setShowTimerModal(true)}
                className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-gray-300 cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <Timer className={`w-4 h-4 transition-colors ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-[#00F0FF] group-hover:text-white'}`} />
                <span className="font-mono text-sm">{formatTime(timerSeconds)}</span>
              </div>
              
              <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1.5 rounded-md transition-all ${isTimerRunning ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                  title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                    addNotification('info', 'Timer reset');
                  }}
                  className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  usePracticeStore.setState({ questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, stepReveals: {}, analysis: null });
                  addNotification('info', 'Practice arena cleared');
                }}
                className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                title="Clear All Questions"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => setViewMode('linear')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'linear' ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
                  title="Linear View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('triple')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'triple' ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
                  title="Triple Grid View"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => setShowSourceLinks(!showSourceLinks)}
                  className={`p-2 rounded-md transition-all ${showSourceLinks ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
                  title="Toggle Source Links"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all border border-[#00F0FF]/30"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Export'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl ${showExportDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all z-50 overflow-hidden`}>
                  <button onClick={handleUploadPracticeSet} disabled={isSaving || isSaved} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {isSaved ? (
                        <motion.div
                          key="saved"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="flex items-center gap-2 text-emerald-400"
                        >
                          <CheckCircle className="w-4 h-4" /> Saved Successfully
                        </motion.div>
                      ) : (
                        <motion.div
                          key="save"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" /> Upload to Courses
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <button onClick={() => {
                    const fallbackTitle = query || (sourceFiles.length > 0 ? sourceFiles[0].name : 'Practice Set');
                    const safeTitle = fallbackTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                    const htmlContent = document.documentElement.innerHTML; // This is a placeholder, handleSaveToDashboard logic should be reused
                    // Re-using the logic from handleSaveToDashboard for actual download
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${safeTitle}_practice_set.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download HTML Quiz
                  </button>
                  <QuestionExporter 
                    questions={questions}
                    title={`${subject} ${examType} Practice Set`}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                  />
                  <button onClick={() => addNotification('info', 'Worksheet Export coming soon')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Export as Worksheet
                  </button>
                  <button onClick={() => addNotification('info', 'Exporting solved slides...')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <Presentation className="w-4 h-4" /> Export Solved Slides
                  </button>
                  <button onClick={() => addNotification('info', 'Exporting solved questions...')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Export Solved Questions
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showFullscreenPrompt && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-[#00F0FF] text-black px-6 py-3 rounded-2xl font-bold shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center gap-3"
            >
              <Maximize2 className="w-5 h-5" />
              Please use Fullscreen mode for the best whiteboard experience
              <button onClick={() => setShowFullscreenPrompt(false)} className="ml-4 p-1 hover:bg-black/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {whiteboardMode === 'side' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="fixed inset-0 z-50 bg-[#0a0b14] flex overflow-hidden"
            >
              {/* Left side: Questions */}
              <div 
                className="h-full border-r border-white/10 overflow-y-auto p-6 bg-black/40 custom-scrollbar flex flex-col"
                style={{ width: `${100 - sideWhiteboardWidth}%` }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
                      <List className="w-5 h-5 text-[#00F0FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white">Question List</h3>
                      <p className="text-xs text-gray-500">Scroll to solve</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 flex-1">
                  <AnimatePresence mode="wait">
                    {questions.map((q, index) => (
                      <div key={`list-item-${q.id}-${index}`} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        {renderQuestionCard(q, index, true)}
                      </div>
                    ))}
                    {isGeneratingSimilar && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel rounded-2xl p-6 border border-[#00F0FF]/30 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                      >
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[#00F0FF]/10 to-transparent" />
                        <div className="flex gap-4 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 shrink-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#00F0FF] animate-pulse" />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-4 bg-white/10 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-12 bg-white/5 rounded-xl border border-white/10" />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Resizer Handle */}
              <div 
                onMouseDown={startResizing}
                className={`w-1.5 h-full cursor-col-resize hover:bg-[#00F0FF] transition-colors flex items-center justify-center group ${isResizing ? 'bg-[#00F0FF]' : 'bg-white/5'}`}
              >
                <div className="w-0.5 h-8 bg-white/20 group-hover:bg-black/40 rounded-full"></div>
              </div>

              {/* Right side: Whiteboard */}
              <div className="h-full flex flex-col relative" style={{ width: `${sideWhiteboardWidth}%` }}>
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <div className="bg-[#111] px-4 py-2 rounded-full border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                    Side Whiteboard Mode
                  </div>
                  <button 
                    onClick={() => setWhiteboardMode('none')}
                    className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Whiteboard 
                  className="flex-1 rounded-none border-0" 
                  initialData={sideWhiteboardData}
                  onSave={(data) => setSideWhiteboardData(data)}
                />
              </div>
            </motion.div>
          ) : whiteboardMode === 'slide' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-[85vh] min-h-[700px] bg-[#0f172a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
            >
              {/* Slide Navigation Bar */}
              <div className="flex items-center justify-between p-4 bg-[#111] border-b border-white/10 z-20">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#B026FF]/20 flex items-center justify-center border border-[#B026FF]/30">
                      <Presentation className="w-5 h-5 text-[#B026FF]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold leading-none">Presentation Mode</h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Slide {currentSlide + 1} of {Math.ceil(questions.length / slideModeConfig.questionsPerSlide)}</p>
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-white/10 mx-2"></div>
                  
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
                    <button 
                      onClick={() => setSlideModeConfig(prev => ({ ...prev, questionsPerSlide: 1 }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${slideModeConfig.questionsPerSlide === 1 ? 'bg-[#00F0FF] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      1 Q/Slide
                    </button>
                    <button 
                      onClick={() => setSlideModeConfig(prev => ({ ...prev, questionsPerSlide: 2 }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${slideModeConfig.questionsPerSlide === 2 ? 'bg-[#00F0FF] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      2 Q/Slide
                    </button>
                  </div>

                  <div className="h-8 w-px bg-white/10 mx-2"></div>

                  <button 
                    onClick={() => setSlideModeConfig(prev => ({ ...prev, overlay: !prev.overlay }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${slideModeConfig.overlay ? 'bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {slideModeConfig.overlay ? 'Overlay: ON' : 'Overlay: OFF'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 mr-4">
                    <button 
                      onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                      disabled={currentSlide === 0}
                      className="p-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 transition-all border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/10 font-mono text-sm text-[#00F0FF]">
                      {currentSlide + 1}
                    </div>
                    <button 
                      onClick={() => setCurrentSlide(Math.min(Math.ceil(questions.length / slideModeConfig.questionsPerSlide) - 1, currentSlide + 1))}
                      disabled={currentSlide === Math.ceil(questions.length / slideModeConfig.questionsPerSlide) - 1}
                      className="p-2.5 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 disabled:opacity-30 transition-all border border-[#00F0FF]/30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setWhiteboardMode('none')} 
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Slide Content */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
                {/* Question Area */}
                <div className={`${slideModeConfig.overlay ? 'absolute inset-0 z-0' : 'w-full lg:w-1/3 border-r border-white/10'} p-8 overflow-y-auto bg-black/40 custom-scrollbar`}>
                   <div className={`space-y-8 ${slideModeConfig.overlay ? 'max-w-4xl mx-auto' : ''}`}>
                     {questions
                       .slice(currentSlide * slideModeConfig.questionsPerSlide, (currentSlide + 1) * slideModeConfig.questionsPerSlide)
                       .map((q, idx) => (
                         <div key={`${q.id}-${idx}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                           {renderQuestionCard(q, currentSlide * slideModeConfig.questionsPerSlide + idx, true)}
                         </div>
                       ))
                     }
                   </div>
                   
                   {!slideModeConfig.overlay && (
                     <div className="mt-12 pt-8 border-t border-white/5">
                       <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Slide Overview</h5>
                       <div className="grid grid-cols-5 gap-2">
                         {Array.from({ length: Math.ceil(questions.length / slideModeConfig.questionsPerSlide) }).map((_, i) => (
                           <button
                             key={i}
                             onClick={() => setCurrentSlide(i)}
                             className={`h-8 rounded-lg border transition-all text-[10px] font-bold ${currentSlide === i ? 'bg-[#00F0FF] border-[#00F0FF] text-black' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'}`}
                           >
                             {i + 1}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
                {/* Whiteboard Area */}
                <div className={`${slideModeConfig.overlay ? 'absolute inset-0 z-10 bg-transparent' : 'w-full lg:w-2/3'} h-full relative`}>
                  <Whiteboard 
                    key={`slide-${currentSlide}-${slideModeConfig.overlay}`}
                    className={`h-full rounded-none border-0 ${slideModeConfig.overlay ? 'bg-transparent' : 'bg-[#1a1b26]'}`} 
                    theme={slideModeConfig.overlay ? 'transparent' : 'dark'}
                    initialData={slideWhiteboardData[currentSlide]}
                    onSave={(data) => setSlideWhiteboardData(prev => ({ ...prev, [currentSlide]: data }))}
                  />
                  <div className="absolute top-4 right-4 pointer-events-none z-10">
                    <div className="bg-[#111] px-4 py-2 rounded-full border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                      {slideModeConfig.overlay ? 'Overlay Annotation Active' : 'Side-by-Side Mode'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div>
              {viewMode === 'linear' && dppMode !== 'sheet' ? (
                // Carousel Mode for List View
                <div className="flex flex-col gap-6 relative">
                   <div className="overflow-hidden relative w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                     <AnimatePresence mode="wait">
                       {questions.length > 0 && (
                         <motion.div
                           key={`carousel-item-${questions[currentSlide]?.id || currentSlide}`}
                           initial={{ opacity: 0, x: 50, scale: 0.95 }}
                           animate={{ opacity: 1, x: 0, scale: 1 }}
                           exit={{ opacity: 0, x: -50, scale: 0.95 }}
                           transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                           className="w-full h-full max-w-full touch-pan-y transform-gpu" style={{ willChange: "transform" }}
                           drag="x"
                           dragConstraints={{ left: 0, right: 0 }}
                           dragElastic={0.2}
                           onDragEnd={(e, { offset, velocity }) => {
                             const swipe = offset.x;
                             if (swipe < -50 && currentSlide < questions.length - 1) {
                               setCurrentSlide(prev => prev + 1);
                             } else if (swipe > 50 && currentSlide > 0) {
                               setCurrentSlide(prev => prev - 1);
                             }
                           }}
                         >
                           {renderQuestionCard(questions[currentSlide], currentSlide, false)}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                   
                   {/* Carousel Navigation */}
                   {questions.length > 0 && (
                     <div className="flex items-center justify-between mt-4">
                        <button 
                          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                          disabled={currentSlide === 0}
                          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft className="w-5 h-5" /> Previous
                        </button>
                        
                        <div className="text-sm font-mono text-gray-400 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                          {currentSlide + 1} / {questions.length}
                        </div>
                        
                        <button 
                          onClick={() => setCurrentSlide(prev => Math.min(questions.length - 1, prev + 1))}
                          disabled={currentSlide === questions.length - 1}
                          className="px-6 py-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2"
                        >
                          Next <ChevronRight className="w-5 h-5" />
                        </button>
                     </div>
                   )}
                </div>
              ) : (
                // Grid / Triple Stack / DPP View
                <div className={
                  viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 
                  viewMode === 'triple' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 
                  'flex flex-col gap-6'
                }>
                  <AnimatePresence mode="wait">
                    {questions.map((q, index) => (
                      <motion.div 
                        key={`main-list-${q.id}-${index}`} 
                        className={`${dppMode === 'sheet' ? 'border-b border-gray-200 last:border-0' : 'h-full'}`}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: false, margin: "-50px" }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                      >
                        {renderQuestionCard(q, index, false)}
                      </motion.div>
                    ))}
                    {isGeneratingSimilar && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel rounded-2xl p-6 border border-[#00F0FF]/30 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)] h-full"
                      >
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[#00F0FF]/10 to-transparent" />
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#00F0FF]">
                           <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin" />
                           </div>
                           <span className="font-bold text-sm">Crafting similar questions...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {dppMode === 'sheet' && questions.length > 0 && !loading && (
                <div className="mt-12 glass-panel rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#00F0FF]" />
                    Answer Key
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {questions.map((q, index) => {
                      const optionIndex = q.options?.indexOf(q.correctAnswer);
                      const answerLetter = optionIndex !== undefined && optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : q.correctAnswer;
                      return (
                        <div key={`ans-key-${q.id}-${index}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                          <span className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="font-bold text-white">
                            {answerLetter}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        
        {questions.length > 0 && !loading && !practiceFinished && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-sm text-gray-400">Add:</span>
              <select
                value={nextQuestionCount}
                onChange={(e) => setNextQuestionCount(Number(e.target.value))}
                className="bg-transparent text-white outline-none text-sm font-medium"
              >
                <option value={10}>10 Qs</option>
                <option value={15}>15 Qs</option>
                <option value={20}>20 Qs</option>
              </select>
            </div>
            <button
              onClick={handleGenerateNext}
              disabled={isGeneratingNext}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingNext ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Next
            </button>
          </div>
        )}

        {questions.length > 0 && !loading && dppMode !== 'sheet' && !practiceFinished && (
          <div className="mt-8 mb-32 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-white/5 rounded-full h-2 mb-8 overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(Object.keys(selectedOptions).length / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF]"
              />
            </div>

            <button 
              onClick={handleFinishPractice}
              disabled={Object.keys(selectedOptions).length === 0}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50 flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              Check Score
            </button>
          </div>
        )}

        {practiceFinished && (
          <div className="mt-8 mb-32 space-y-12">
            <Scorecard 
              score={questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length}
              total={questions.length}
              accuracy={(questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length / questions.length) * 100}
              timeTaken={timerSeconds}
            />

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin" />
                <p className="text-gray-400 font-medium animate-pulse">AI is analyzing your performance...</p>
              </div>
            ) : analysis ? (
              <DetailedAnalysis data={analysis} />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-white/5 rounded-3xl border border-white/10">
                <BrainCircuit className="w-12 h-12 text-[#B026FF] mb-4 opacity-50" />
                <h4 className="text-xl font-bold text-white mb-2">Deep Performance Analysis</h4>
                <p className="text-gray-400 text-center max-w-md mb-6 px-6">
                  Get AI-powered insights, feedback, and personalized tips based on your practice session.
                </p>
                <button 
                  onClick={handleStartAnalysis}
                  className="px-8 py-3 rounded-xl bg-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze Performance
                </button>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={handleUploadReport}
                className="px-8 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload to Courses
              </button>
              <button 
                onClick={() => {
                  setPracticeFinished(false);
                  usePracticeStore.setState({ selectedOptions: {}, showSolutions: {}, showHints: {}, stepReveals: {}, analysis: null });
                  setTimerSeconds(0);
                  setIsTimerRunning(true);
                }}
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Practice
              </button>
              <button 
                onClick={() => {
                  setPracticeFinished(false);
                  usePracticeStore.setState({ questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, stepReveals: {}, analysis: null });
                  setTimerSeconds(0);
                  setQuery("");
                }}
                className="px-8 py-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-bold hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Session
              </button>
            </div>
          </div>
        )}

        {questions.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Enter a topic above to generate practice questions</p>
          </div>
        )}
      </div>

      {/* Dashboard File Selector Modal */}
      <AnimatePresence>
        {/* Timer Settings Modal */}
        {showTimerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimerModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-panel rounded-3xl border border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Set Practice Timer</h3>
                </div>
                <button 
                  onClick={() => setShowTimerModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Quick Presets</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setTargetTimerSeconds(mins * 60);
                          setTimerSeconds(0);
                          setShowTimerModal(false);
                          setIsTimerRunning(true);
                          addNotification('success', `Timer set for ${mins} minutes`);
                        }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 transition-all group text-center"
                      >
                        <div className="text-xl font-display font-bold text-white group-hover:text-[#00F0FF] transition-colors">{mins}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Mins</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Custom Duration</h4>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        placeholder="Enter minutes..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value);
                            if (val > 0) {
                              setTargetTimerSeconds(val * 60);
                              setTimerSeconds(0);
                              setShowTimerModal(false);
                              setIsTimerRunning(true);
                              addNotification('success', `Timer set for ${val} minutes`);
                            }
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all font-mono"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold uppercase tracking-wider">Mins</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling?.querySelector('input') || e.currentTarget.previousElementSibling) as HTMLInputElement;
                        const val = parseInt(input.value);
                        if (val > 0) {
                          setTargetTimerSeconds(val * 60);
                          setTimerSeconds(0);
                          setShowTimerModal(false);
                          setIsTimerRunning(true);
                          addNotification('success', `Timer set for ${val} minutes`);
                        }
                      }}
                      className="px-6 py-4 rounded-2xl bg-[#00F0FF] text-black font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                    >
                      Set
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-center">
                  <button 
                    onClick={() => {
                      setTargetTimerSeconds(0);
                      setTimerSeconds(0);
                      setIsTimerRunning(false);
                      setShowTimerModal(false);
                      addNotification('info', 'Timer disabled');
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-bold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset & Disable Timer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Dashboard File Selector */}
        <DashboardFileSelector
          isOpen={showDashboardSelector}
          onClose={() => setShowDashboardSelector(false)}
          onSelect={async (file) => {
            try {
              // Use proxy to fetch actual content for non-data URLs to avoid CORS issues
              const proxyUrl = `/api/proxy?url=${encodeURIComponent(file.url || file.fileUrl)}`;
              const res = await fetch(proxyUrl);
              if (!res.ok) throw new Error(`Proxy fetch failed: ${res.statusText}`);
              
              const blob = await res.blob();
              const reader = new FileReader();
              reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                setSourceFiles([...sourceFiles, {
                  name: file.name || file.title,
                  data: base64String,
                  mimeType: file.type || 'application/pdf'
                }]);
                setShowDashboardSelector(false);
                addNotification('success', `Selected: ${file.name || file.title}`);
              };
              reader.onerror = (err) => {
                console.error("FileReader error:", err);
                addNotification('error', 'Failed to read file content');
              };
              reader.readAsDataURL(blob);
            } catch (error) {
              console.error("Failed to load dashboard file", error);
              addNotification('error', 'Failed to load file from dashboard');
            }
          }}
          title="Select Source Content"
        />

        <UploadToCoursesModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title={uploadContent?.title || 'Upload Practice Report'}
          onUpload={async (data) => {
            if (!uploadContent) return;
            try {
              const file = new File([uploadContent.content], `${uploadContent.title}.md`, { type: 'text/markdown' });
              const contextStr = `title=${uploadContent.title}|subject=${data.subject}|class=${data.class}|description=Practice Session Report|fileType=Markdown|tags=practice,report`;
              await addUpload(file, contextStr);
              addNotification('success', 'Practice report uploaded to courses!');
              setShowUploadModal(false);
            } catch (error) {
              console.error('Upload failed:', error);
              addNotification('error', 'Failed to upload report');
            }
          }}
        />
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-32 h-32 bg-gradient-to-br from-[#FFD600] to-[#FF8A00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,214,0,0.6)] mb-6 border-4 border-white/20"
              >
                <Award className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] mb-2">
                Excellent Performance!
              </h2>
              <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold tracking-widest uppercase shadow-lg">
                Top Performer
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
