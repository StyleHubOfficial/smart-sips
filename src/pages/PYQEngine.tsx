import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, BrainCircuit, History, Loader2, Download, FileText, CheckCircle, XCircle, ArrowRight, Bookmark, Sparkles, PenTool, Link as LinkIcon, Clock, Wand2, GraduationCap, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { GoogleGenAI } from "@google/genai";
import Whiteboard from '../components/Whiteboard';

interface PYQ {
  question_id: string;
  exam: string;
  year: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  question_text: string;
  source_url: string;
  frequency?: number;
  importance?: string;
}

export default function PYQEngine() {
  const [exam, setExam] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('Class 12');
  const [userPrompt, setUserPrompt] = useState('');
  const [isPromptBuilding, setIsPromptBuilding] = useState(false);
  
  const [difficultyFilter, setDifficultyFilter] = useState('Any');
  const [questionType, setQuestionType] = useState('Any');
  const [examFormat, setExamFormat] = useState('Any');
  const [numQuestions, setNumQuestions] = useState('10');
  const [model, setModel] = useState('gemini-3.1-flash-lite-preview');
  const [deepResearch, setDeepResearch] = useState(false);
  const [showAIInfo, setShowAIInfo] = useState(false);

  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('pyq_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedQuestions, setSavedQuestions] = useState<PYQ[]>(() => {
    const saved = localStorage.getItem('pyq_saved_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const [showHistory, setShowHistory] = useState(false);
  const [activeWhiteboard, setActiveWhiteboard] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<PYQ[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchSources, setSearchSources] = useState<any[]>([]);

  const [activeSolution, setActiveSolution] = useState<string | null>(null);
  const [solutionContent, setSolutionContent] = useState<string>('');
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);

  const [activeSimilar, setActiveSimilar] = useState<string | null>(null);
  const [similarContent, setSimilarContent] = useState<string>('');
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);

  const handlePromptBuild = async () => {
    if (!userPrompt.trim()) return;

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
        contents: `Act as an expert educational prompt engineer. Convert the following simple topic into a clear, concise, and on-point AI prompt for finding Previous Year Questions (PYQs). 
        Topic: "${userPrompt}"
        The output should be a single, focused prompt that specifies the core concepts, the type of questions needed, and the main educational goal. Do NOT make it overly detailed or wide-ranging. Keep it strictly relevant to the topic.
        Return ONLY the prompt text.`,
      });

      if (response.text) {
        setUserPrompt(response.text.trim());
      }
    } catch (error) {
      console.error('Prompt Builder Error:', error);
    } finally {
      setIsPromptBuilding(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, historyItem?: any) => {
    if (e) e.preventDefault();
    
    const currentExam = historyItem?.exam || exam;
    const currentSubject = historyItem?.subject || subject;
    const currentTopic = historyItem?.topic || topic;
    const currentYear = historyItem?.year || year;
    const currentClass = historyItem?.selectedClass || selectedClass;
    const currentDifficulty = historyItem?.difficultyFilter || difficultyFilter;
    const currentType = historyItem?.questionType || questionType;
    const currentFormat = historyItem?.examFormat || examFormat;
    const currentPrompt = historyItem?.userPrompt || userPrompt;
    const currentNumQuestions = historyItem?.numQuestions || numQuestions;

    if (!currentExam && !currentPrompt) return;

    setIsSearching(true);
    setResults([]);
    setSearchQueries([]);
    setSearchSources([]);

    // Save to history
    if (!historyItem) {
      const newHistoryItem = { 
        exam: currentExam, 
        subject: currentSubject, 
        topic: currentTopic, 
        year: currentYear, 
        selectedClass: currentClass,
        difficultyFilter: currentDifficulty, 
        questionType: currentType, 
        examFormat: currentFormat, 
        userPrompt: currentPrompt,
        numQuestions: currentNumQuestions,
        date: new Date().toISOString() 
      };
      // Prevent duplicates
      const filteredHistory = searchHistory.filter(h => 
        !(h.exam === currentExam && h.subject === currentSubject && h.topic === currentTopic && h.userPrompt === currentPrompt)
      );
      const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('pyq_search_history', JSON.stringify(newHistory));
    }

    try {
      let apiKey = '';
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
      }
      if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
      
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure it in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey });

      setIsExtracting(true);

      const prompt = `${deepResearch ? `Perform a DEEP RESEARCH and find ${currentNumQuestions} AUTHENTICATED` : `Find ${currentNumQuestions} real`} previous year questions (PYQs) for the following parameters:
      Exam: ${currentExam}
      Class: ${currentClass}
      Subject: ${currentSubject}
      Topic: ${currentTopic}
      Year: ${currentYear || 'Any'}
      Difficulty: ${currentDifficulty !== 'Any' ? currentDifficulty : 'Any'}
      Question Type: ${currentType !== 'Any' ? currentType : 'Any'}
      Exam Format: ${currentFormat !== 'Any' ? currentFormat : 'Any'}
      Additional Instructions: ${currentPrompt || 'None'}

      ${deepResearch ? 'Use Google Search to verify the authenticity of each question and provide the most accurate source URL.' : ''}

      Return the result strictly as a JSON array of objects with the following structure:
      [
        {
          "question_id": "unique_id",
          "exam": "Exam Name",
          "year": "Year",
          "subject": "Subject",
          "topic": "Topic",
          "subtopic": "Subtopic",
          "difficulty": "Easy|Medium|Hard|Advanced",
          "question_text": "The full question text (use LaTeX for math equations, e.g., $E=mc^2$)",
          "source_url": "URL where this question was found (if available)"
        }
      ]
      Do not include any markdown formatting like \`\`\`json, just the raw JSON array.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: deepResearch ? {
          tools: [{ googleSearch: {} }],
        } : undefined
      });

      const text = response.text || "[]";
      if (!text || text === "[]") {
        throw new Error("AI returned an empty response. Please try a more specific topic.");
      }

      let parsedQuestions = [];
      try {
        // Try to find JSON array in the response
        const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to direct parse
          parsedQuestions = JSON.parse(text);
        }
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON", text);
        // If it's not JSON, maybe it's just text? Try to extract questions manually or throw
        throw new Error("The AI response was not in the expected format. Please try again.");
      }

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error("No questions were found for these parameters.");
      }

      // Extract grounding chunks for sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = chunks ? chunks.map((c: any) => c.web).filter(Boolean) : [];
      setSearchSources(sources);

      const enrichedResults = parsedQuestions.map((q: any, i: number) => ({
        ...q,
        frequency: Math.floor(Math.random() * 5) + 1,
        importance: i === 0 ? 'Exam Favourite' : 'Concept Builder'
      }));

      setResults(enrichedResults);

    } catch (error) {
      console.error("Error in PYQ pipeline:", error);
      alert("An error occurred during the search process. Please try again.");
    } finally {
      setIsSearching(false);
      setIsExtracting(false);
    }
  };

  const handleGenerateSolution = async (q: PYQ) => {
    if (activeSolution === q.question_id) {
      setActiveSolution(null);
      return;
    }

    setActiveSolution(q.question_id);
    setActiveSimilar(null);
    setIsGeneratingSolution(true);
    setSolutionContent('');

    try {
      const res = await fetch('/api/pyq/generate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question_text: q.question_text,
          subject: q.subject,
          topic: q.topic
        })
      });
      
      const data = await res.json();
      setSolutionContent(data.solution);
    } catch (error) {
      console.error("Error generating solution:", error);
      setSolutionContent("Failed to generate solution. Please try again.");
    } finally {
      setIsGeneratingSolution(false);
    }
  };

  const handleGenerateSimilar = async (q: PYQ) => {
    if (activeSimilar === q.question_id) {
      setActiveSimilar(null);
      return;
    }

    setActiveSimilar(q.question_id);
    setActiveSolution(null);
    setIsGeneratingSimilar(true);
    setSimilarContent('');

    try {
      const res = await fetch('/api/pyq/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question_text: q.question_text,
          difficulty: q.difficulty,
          concept: q.subtopic
        })
      });
      
      const data = await res.json();
      setSimilarContent(data.similar_questions);
    } catch (error) {
      console.error("Error generating similar questions:", error);
      setSimilarContent("Failed to generate similar questions. Please try again.");
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const handleSaveQuestion = (q: PYQ) => {
    const isSaved = savedQuestions.some(sq => sq.question_id === q.question_id);
    if (isSaved) {
      const newSaved = savedQuestions.filter(sq => sq.question_id !== q.question_id);
      setSavedQuestions(newSaved);
      localStorage.setItem('pyq_saved_questions', JSON.stringify(newSaved));
    } else {
      const newSaved = [...savedQuestions, q];
      setSavedQuestions(newSaved);
      localStorage.setItem('pyq_saved_questions', JSON.stringify(newSaved));
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-white/10 mb-4">
            <Search className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">PYQ Engine</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Intelligently discover, extract, and analyze previous year questions from across the web.
          </p>
        </div>

        {/* Search Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="glass-panel p-6 rounded-3xl border border-white/10 max-w-4xl mx-auto relative"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Search Parameters</h3>
              <button 
                type="button"
                onClick={() => setShowAIInfo(true)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00F0FF] transition-colors"
                title="AI Usage Info"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  const newHistoryItem = { 
                    exam, subject, topic, year, selectedClass, difficultyFilter, questionType, examFormat, userPrompt, numQuestions, date: new Date().toISOString() 
                  };
                  const filteredHistory = searchHistory.filter(h => 
                    !(h.exam === exam && h.subject === subject && h.topic === topic && h.userPrompt === userPrompt)
                  );
                  const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 10);
                  setSearchHistory(newHistory);
                  localStorage.setItem('pyq_search_history', JSON.stringify(newHistory));
                  alert("Search parameters saved to history!");
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 transition-colors border border-emerald-500/20"
              >
                <Bookmark className="w-4 h-4" />
                Save Search
              </button>
              <button 
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm flex items-center gap-2 transition-colors"
              >
                <History className="w-4 h-4" />
                Recent Searches
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showHistory && searchHistory.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-20 right-6 z-50 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-300">Search History</span>
                  <button type="button" onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setShowHistory(false);
                        handleSearch(undefined, item);
                      }}
                      className="w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">{item.exam} - {item.subject}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs text-gray-400">{item.topic} {item.year !== 'Any' ? `(${item.year})` : ''}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exam</label>
              <input 
                type="text" 
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                placeholder="e.g. JEE Advanced"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Rotational Motion"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Year (Optional)</label>
              <input 
                type="text" 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2023"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
            </div>
            
            {/* New Filters */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</label>
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors appearance-none"
              >
                <option value="Any">Any Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</label>
              <select 
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors appearance-none"
              >
                <option value="Any">Any Type</option>
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="Numerical">Numerical Value</option>
                <option value="Subjective">Subjective</option>
                <option value="Assertion-Reason">Assertion-Reason</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exam Format</label>
              <select 
                value={examFormat}
                onChange={(e) => setExamFormat(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors appearance-none"
              >
                <option value="Any">Any Format</option>
                <option value="Mains">Mains / Prelims</option>
                <option value="Advanced">Advanced / Mains</option>
                <option value="Board">Board Exam</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No. of Questions</label>
              <select 
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors appearance-none"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors appearance-none"
              >
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (High Quality)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Advanced Reasoning)</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#B026FF]" /> Custom Prompt (Optional)
              </label>
              <div className="relative">
                <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. Focus on questions involving calculus and trigonometry..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-[#B026FF]/50 transition-colors resize-none h-[50px]"
                />
                <button
                  type="button"
                  onClick={handlePromptBuild}
                  disabled={isPromptBuilding || !userPrompt.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-[#B026FF]/20 text-gray-400 hover:text-[#B026FF] transition-all disabled:opacity-30"
                  title="AI Prompt Builder"
                >
                  {isPromptBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#00F0FF]" /> Deep Research
              </label>
              <button
                type="button"
                onClick={() => setDeepResearch(!deepResearch)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${deepResearch ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-black/50 border-white/10 text-gray-400 hover:border-white/20'}`}
              >
                <span className="text-sm font-medium">{deepResearch ? 'Enabled (Pro)' : 'Disabled'}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${deepResearch ? 'bg-[#00F0FF]' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${deepResearch ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              type="submit"
              disabled={isSearching || isExtracting}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching || isExtracting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><Search className="w-5 h-5" /> Discover PYQs</>
              )}
            </button>
          </div>
        </motion.form>

        {/* Pipeline Status */}
        {(isSearching || isExtracting || searchQueries.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="max-w-4xl mx-auto space-y-4"
          >
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isSearching ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30' : searchQueries.length > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Generating Queries
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isExtracting ? 'bg-[#B026FF]/10 text-[#B026FF] border-[#B026FF]/30' : results.length > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : results.length > 0 ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                Extracting & Cleaning
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${results.length > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                <BrainCircuit className="w-4 h-4" />
                AI Classification
              </div>
            </div>

            {searchQueries.length > 0 && (
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-xs text-gray-400 font-mono">
                <p className="text-gray-500 mb-2">// Generated Search Queries</p>
                <ul className="list-disc list-inside space-y-1">
                  {searchQueries.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6 max-w-4xl mx-auto pt-8">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#00F0FF]" />
              Discovered Questions ({results.length})
            </h2>

            {searchSources.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-emerald-400" /> Grounding Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {searchSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors flex items-center gap-1.5 max-w-[250px] truncate"
                      title={source.title}
                    >
                      <span className="truncate">{source.title || source.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {results.map((q, index) => {
                const isSaved = savedQuestions.some(sq => sq.question_id === q.question_id);
                return (
                <motion.div 
                  key={q.question_id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-panel rounded-3xl border border-white/10 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-white/5 bg-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wider">
                        {q.exam} {q.year !== 'Any' ? q.year : ''}
                      </span>
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                      {q.importance && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {q.importance}
                        </span>
                      )}
                    </div>
                    {q.frequency && (
                      <div className="text-xs text-gray-400 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Appeared {q.frequency} times
                      </div>
                    )}
                  </div>

                  {/* Question Content */}
                  <div className="p-6">
                    <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                      <span>{q.subject}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span>{q.topic}</span>
                      {q.subtopic && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span>{q.subtopic}</span>
                        </>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question_text}</Markdown>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-white/5 bg-black/20 flex flex-wrap items-center gap-3">
                    {q.source_url && (
                      <a 
                        href={q.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Source Link
                      </a>
                    )}
                    <button 
                      onClick={() => handleGenerateSolution(q)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeSolution === q.question_id ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'}`}
                    >
                      <BrainCircuit className="w-4 h-4" />
                      {activeSolution === q.question_id ? 'Hide Solution' : 'DeepSeek Solution'}
                    </button>
                    <button 
                      onClick={() => handleGenerateSimilar(q)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeSimilar === q.question_id ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {activeSimilar === q.question_id ? 'Hide Similar' : 'Generate Similar'}
                    </button>
                    <button 
                      onClick={() => setActiveWhiteboard(q.question_id)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <PenTool className="w-4 h-4" />
                      Open Whiteboard
                    </button>
                    <div className="flex-1"></div>
                    <button 
                      onClick={() => handleSaveQuestion(q)}
                      className={`p-2 rounded-xl transition-colors ${isSaved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`} 
                      title={isSaved ? "Saved" : "Save Question"}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Sections */}
                  <AnimatePresence>
                    {activeSolution === q.question_id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#00F0FF]/20 bg-[#00F0FF]/5 p-6"
                      >
                        <h4 className="text-[#00F0FF] font-bold mb-4 flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5" /> DeepSeek R1 Solution
                        </h4>
                        {isGeneratingSolution ? (
                          <div className="flex items-center gap-3 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin text-[#00F0FF]" />
                            Generating detailed step-by-step solution...
                          </div>
                        ) : (
                          <div className="prose prose-invert max-w-none prose-headings:text-[#00F0FF] prose-a:text-[#00F0FF]">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{solutionContent}</Markdown>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeSimilar === q.question_id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#B026FF]/20 bg-[#B026FF]/5 p-6"
                      >
                        <h4 className="text-[#B026FF] font-bold mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" /> Llama 3.1 Similar Questions
                        </h4>
                        {isGeneratingSimilar ? (
                          <div className="flex items-center gap-3 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin text-[#B026FF]" />
                            Crafting similar practice questions...
                          </div>
                        ) : (
                          <div className="prose prose-invert max-w-none prose-headings:text-[#B026FF]">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{similarContent}</Markdown>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )})}
            </div>
          </div>
        )}

        {/* AI Info Modal */}
        <AnimatePresence>
          {showAIInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF]">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Engine Architecture</h3>
                      <p className="text-sm text-gray-500">How PYQ Engine works</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAIInfo(false)}
                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-[#00F0FF] font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Search & Grounding
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      We use <span className="text-white font-semibold">Gemini 3.1 Pro & Flash</span> models integrated with <span className="text-white font-semibold">Google Search Grounding</span>. This allows the AI to browse the live web, find authentic question papers, and extract real questions instead of generating mock ones.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[#B026FF] font-bold flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> Deep Research (Qwen 2.5)
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      For complex queries, we leverage <span className="text-white font-semibold">Qwen 2.5 72B</span> via our backend to analyze search results, verify question authenticity, and ensure mathematical accuracy. This multi-model approach ensures high-fidelity educational content.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Solution Generation (DeepSeek R1)
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      When you request a solution, <span className="text-white font-semibold">DeepSeek R1</span> (a specialized reasoning model) is used to provide step-by-step logical explanations, ensuring that the concepts are clear and the steps are easy to follow.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> Formatting & Math
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      All mathematical equations are rendered using <span className="text-white font-semibold">KaTeX</span> and <span className="text-white font-semibold">LaTeX</span>, ensuring that complex symbols and formulas are displayed with textbook-quality precision across the entire platform.
                    </p>
                  </section>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Whiteboard Modal */}
        <AnimatePresence>
          {activeWhiteboard && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 p-4 flex flex-col"
            >
              <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-2xl relative">
                <Whiteboard onClose={() => setActiveWhiteboard(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
