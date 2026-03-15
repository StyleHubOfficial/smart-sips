import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, BrainCircuit, History, Loader2, Download, FileText, CheckCircle, XCircle, ArrowRight, Bookmark, Sparkles, PenTool } from 'lucide-react';
import Markdown from 'react-markdown';

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || !subject || !topic) return;

    setIsSearching(true);
    setResults([]);
    setSearchQueries([]);
    setSearchSources([]);

    try {
      // Step 1: Search
      const searchRes = await fetch('/api/pyq/search-pyq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam, subject, topic, year })
      });
      
      const searchData = await searchRes.json();
      setSearchQueries(searchData.queries || []);
      setSearchSources(searchData.results || []);

      // Step 2: Extract (Mocking the extraction process for the demo)
      setIsExtracting(true);
      
      // We'll simulate extracting from the first source
      const mockText = `1. A particle of mass m is moving in a circular path of constant radius r such that its centripetal acceleration ac is varying with time t as ac = k^2 r t^2, where k is a constant. The power delivered to the particle by the forces acting on it is:
(A) 2pi m k^2 r^2 t
(B) m k^2 r^2 t
(C) (m k^4 r^2 t^5)/3
(D) 0

2. Two identical capacitors, have the same capacitance C. One of them is charged to potential V1 and the other to V2. The negative ends of the capacitors are connected together. When the positive ends are also connected, the decrease in energy of the combined system is:
(A) 1/4 C (V1^2 - V2^2)
(B) 1/4 C (V1^2 + V2^2)
(C) 1/4 C (V1 - V2)^2
(D) 1/4 C (V1 + V2)^2`;

      const extractRes = await fetch('/api/pyq/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mockText, sourceUrl: searchData.results?.[0]?.url || 'https://example.com' })
      });

      const extractData = await extractRes.json();
      
      // Add some mock analytics data to the results
      const enrichedResults = (extractData.questions || []).map((q: any, i: number) => ({
        ...q,
        frequency: Math.floor(Math.random() * 5) + 1,
        importance: i === 0 ? 'Exam Favourite' : 'Concept Builder'
      }));

      setResults(enrichedResults);

    } catch (error) {
      console.error("Error in PYQ pipeline:", error);
      alert("An error occurred during the search process.");
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
          className="glass-panel p-6 rounded-3xl border border-white/10 max-w-4xl mx-auto"
        >
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

            <div className="space-y-6">
              {results.map((q, index) => (
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
                        {q.exam} {q.year}
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
                      <Markdown>{q.question_text}</Markdown>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-white/5 bg-black/20 flex flex-wrap items-center gap-3">
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
                    <button className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      Open Whiteboard
                    </button>
                    <div className="flex-1"></div>
                    <button className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Save Question">
                      <Bookmark className="w-5 h-5" />
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
                            <Markdown>{solutionContent}</Markdown>
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
                            <Markdown>{similarContent}</Markdown>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
