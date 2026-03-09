import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, CheckCircle, XCircle, HelpCircle, Loader2, Save, BrainCircuit, LayoutGrid, List, Square, Sparkles, Plus, FileText, X, Activity, Timer, Presentation, LayoutPanelLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { usePracticeStore } from '../store/usePracticeStore';
import { useUploadStore } from '../store/useUploadStore';
import CinematicLoader from '../components/CinematicLoader';
import Whiteboard from '../components/Whiteboard';
import { useLocation } from 'react-router-dom';

export default function Practice() {
  const { 
    query, questionCount, subject, examType, classLevel, model, viewMode, difficulty, isPYQ, pyqYear, questionType, examFormat, isSmartPanelMode, sourceFile, questions, loading, selectedOptions, showSolutions, showHints, analysis, analyzing, whiteboardMode,
    setQuery, setQuestionCount, setSubject, setExamType, setClassLevel, setModel, setViewMode, setDifficulty, setIsPYQ, setPyqYear, setQuestionType, setExamFormat, setIsSmartPanelMode, setSourceFile, setSelectedOption, setShowHint, generateQuestions, analyzeScore, setWhiteboardMode
  } = usePracticeStore();
  
  const { role } = useAuthStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  const { addUpload, uploads } = useUploadStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (location.state?.sourceContent) {
      const { sourceContent, extractedData } = location.state;
      const autoQuery = `Create practice questions for: ${extractedData?.topic || sourceContent.context?.custom?.title || 'this content'}. Focus on: ${extractedData?.keyConcepts?.join(', ') || ''}`;
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
  const isSaving = uploads.some(u => u.status === 'uploading' && u.contextStr.includes(`title=${query} Practice Set`));

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

  const handleSearch = async () => {
    if (!query.trim() && !sourceFile) return;
    
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
      await generateQuestions(apiKey);
    } catch (error) {
      console.error("Generation Error:", error);
      addNotification('error', 'Failed to generate questions. Please check your API key and try again.');
    }
  };

  const handleOptionClick = (questionId: string, option: string) => {
    if (selectedOptions[questionId]) return;
    setSelectedOption(questionId, option);
  };

  const handleSaveToDashboard = async () => {
    if (questions.length === 0) return;
    
    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${query} Practice Set</title>
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
        <h1>${query} Practice Set</h1>
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
      const file = new File([blob], `${query.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}_practice_set.html`, { type: 'text/html' });

      const contextStr = `title=${query} Practice Set|teacher=${role === 'teacher' ? 'Teacher' : role}|subject=${subject}|class=${classLevel}|description=Interactive practice questions for ${query} (${questionCount} Qs) - ${examType}|fileType=HTML Quiz`;
      
      // Start background upload
      addUpload(file, contextStr);
      
      addNotification('info', 'Saving practice set in background...');
    } catch (error) {
      console.error('Error saving practice set:', error);
      addNotification('error', 'Failed to save practice set.');
    }
  };

  const renderQuestionCard = (q: any, index: number, compact = false) => (
    <motion.div
      key={q.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-panel rounded-2xl p-6 border border-white/10 flex flex-col ${viewMode === 'triple' && !compact ? 'h-full' : ''} ${isSmartPanelMode && !compact ? 'scale-[1.02] shadow-2xl' : ''} ${compact ? 'bg-transparent border-none p-0 shadow-none' : ''}`}
    >
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
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-bold text-[#00F0FF]">
          {index + 1}
        </div>
        <div className={`font-medium text-white prose prose-invert max-w-none prose-p:my-0 prose-pre:my-2 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 ${isSmartPanelMode ? 'text-2xl' : 'text-lg'}`}>
          <Markdown>{q.question}</Markdown>
        </div>
      </div>
      
      {q.options && q.options.length > 0 && (
        <div className={`grid gap-3 mb-4 ${viewMode === 'triple' && !compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {q.options.map((option: string, optIndex: number) => {
            const isSelected = selectedOptions[q.id] === option;
            const isCorrect = q.correctAnswer === option;
            const showResult = !!selectedOptions[q.id];
            
            let optionClass = "bg-white/5 border-white/10 hover:bg-white/10";
            if (showResult) {
              if (isCorrect) optionClass = "bg-green-500/20 border-green-500/50 text-green-200";
              else if (isSelected) optionClass = "bg-red-500/20 border-red-500/50 text-red-200";
              else optionClass = "bg-white/5 border-white/10 opacity-50";
            }

            return (
              <button
                key={optIndex}
                onClick={() => handleOptionClick(q.id, option)}
                disabled={showResult}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group text-sm ${optionClass} ${isSmartPanelMode ? 'text-lg p-4' : ''}`}
              >
                <div className="prose prose-invert max-w-none prose-p:my-0 prose-pre:my-0">
                  <Markdown>{option}</Markdown>
                </div>
                {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 shrink-0 ml-2" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}

      {(!q.options || q.options.length === 0) && (
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

      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
        {q.hint && (
          <button 
            onClick={() => setShowHint(q.id, !showHints[q.id])}
            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
          >
            {showHints[q.id] ? 'Hide Hint' : 'Show Hint'}
          </button>
        )}
        <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors">
          Step Reveal
        </button>
      </div>

      {showHints[q.id] && q.hint && (
        <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-sm text-yellow-200/80">
          <Markdown>{q.hint}</Markdown>
        </div>
      )}

      {showSolutions[q.id] && (
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
            <Markdown>{q.solution}</Markdown>
          </div>

          <button className="mt-2 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B026FF]/10 text-[#B026FF] border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI Explanation
          </button>

          {q.sourceLink && (
            <div className="text-xs text-gray-500 border-t border-white/10 pt-2 mt-3">
              Source: <a href={q.sourceLink} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline truncate inline-block max-w-full align-bottom">{q.sourceLink}</a>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      <div className="mb-10 flex items-center gap-4">
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

      {/* Search Section */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10 space-y-4">
        {/* Row 1: Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Class</label>
            <select 
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
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
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</label>
            <select 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
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
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Exam Type</label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
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
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Board Level">Board Level</option>
              <option value="Competition Level">Competition Level</option>
            </select>
          </div>
        </div>

        {/* Row 2: Advanced Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Question Type</label>
            <select 
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
            >
              <option value="Mixed">Mixed</option>
              <option value="MCQ">MCQ</option>
              <option value="Integer Type">Integer Type</option>
              <option value="Assertion Reason">Assertion Reason</option>
              <option value="Numerical">Numerical</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Long Answer">Long Answer</option>
            </select>
          </div>

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
              <option value="gemini-3.1-pro-preview">High Quality</option>
              <option value="gemini-2.5-flash">Medium Quality</option>
              <option value="gemini-3.1-flash-lite-preview">Fast</option>
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

        {/* Row 3: PYQ and Smart Panel */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPYQ}
              onChange={(e) => setIsPYQ(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-black/40 text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-white">PYQ Mode</span>
          </label>

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
              checked={isSmartPanelMode}
              onChange={(e) => setIsSmartPanelMode(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-black/40 text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-white">Smart Panel Mode</span>
          </label>

          <div className="flex items-center justify-end">
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`e.g. ${questionCount} ${difficulty} questions of ${examType} in ${subject}...`}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSearch}
            disabled={loading || (!query.trim() && !sourceFile)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {loading && (
          <div className="py-8">
            <CinematicLoader />
          </div>
        )}

        {!loading && questions.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Generated Questions <span className="text-gray-500 text-sm font-normal">({questions.length})</span>
            </h3>
            
            {Object.keys(selectedOptions).length === questions.length && (
              <div className="bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 px-4 py-2 rounded-xl text-white font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00F0FF]" />
                Score: {questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length} / {questions.length}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWhiteboardMode(whiteboardMode === 'side' ? 'none' : 'side')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${whiteboardMode === 'side' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
              >
                <LayoutPanelLeft className="w-4 h-4" />
                Side Whiteboard
              </button>
              <button
                onClick={() => setWhiteboardMode(whiteboardMode === 'slide' ? 'none' : 'slide')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${whiteboardMode === 'slide' ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/50' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
              >
                <Presentation className="w-4 h-4" />
                Slide Mode
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-gray-300">
                <Timer className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-mono text-sm">00:00:00</span>
              </div>

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

              <div className="relative group">
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all border border-[#00F0FF]/30"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Export'}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button onClick={handleSaveToDashboard} disabled={isSaving} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Save to Dashboard
                  </button>
                  <button onClick={() => addNotification('info', 'PDF Export coming soon')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Export as PDF
                  </button>
                  <button onClick={() => addNotification('info', 'Worksheet Export coming soon')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Export as Worksheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {whiteboardMode === 'side' ? (
            <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
              {/* Left side: Questions */}
              <div className="w-full lg:w-1/3 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {questions.map((q, index) => renderQuestionCard(q, index))}
              </div>
              {/* Right side: Whiteboard */}
              <div className="w-full lg:w-2/3 h-full">
                <Whiteboard onClose={() => setWhiteboardMode('none')} className="h-full" />
              </div>
            </div>
          ) : whiteboardMode === 'slide' ? (
            <div className="flex flex-col h-[80vh] min-h-[600px] bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Slide Navigation Bar */}
              <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">Slide {currentSlide + 1} of {questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentSlide(Math.min(questions.length - 1, currentSlide + 1))}
                    disabled={currentSlide === questions.length - 1}
                    className="p-2 rounded-lg bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => setWhiteboardMode('none')} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors ml-4">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Slide Content */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Question Area */}
                <div className="w-full lg:w-1/3 p-6 overflow-y-auto border-r border-white/10 bg-[#1e293b]/50 custom-scrollbar">
                   {questions[currentSlide] && renderQuestionCard(questions[currentSlide], currentSlide, true)}
                </div>
                {/* Whiteboard Area */}
                <div className="w-full lg:w-2/3 h-full relative">
                  <Whiteboard className="h-full rounded-none border-0" />
                </div>
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 
              viewMode === 'triple' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 
              'space-y-6'
            }>
              {!loading && questions.map((q, index) => renderQuestionCard(q, index))}
            </div>
          )}
        </AnimatePresence>
        
        {questions.length > 0 && !loading && (
          <div className="mt-8 flex flex-col items-center">
            {Object.keys(selectedOptions).length === questions.length && (
              <div className="bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 px-6 py-4 rounded-2xl text-white font-bold flex flex-col items-center gap-2 mb-8 w-full max-w-md text-center">
                <div className="text-sm text-gray-300 uppercase tracking-wider">Final Score</div>
                <div className="text-4xl font-display text-[#00F0FF]">
                  {questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length} / {questions.length}
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {Math.round((questions.filter(q => selectedOptions[q.id] === q.correctAnswer).length / questions.length) * 100)}% Accuracy
                </div>
              </div>
            )}

            {!analysis && (
              <button 
                onClick={async () => {
                  let apiKey = '';
                  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
                    apiKey = process.env.GEMINI_API_KEY;
                  }
                  if (!apiKey && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
                    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                  }
                  if (!apiKey) {
                    addNotification('error', 'Gemini API key is missing');
                    return;
                  }
                  await analyzeScore(apiKey);
                }}
                disabled={analyzing || Object.keys(selectedOptions).length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                {analyzing ? 'Analyzing Performance...' : 'Analyze Score & Get Tips'}
              </button>
            )}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-6 glass-panel rounded-2xl p-8 border border-[#00F0FF]/30 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F0FF] to-[#B026FF]" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF]">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Advanced Score Analysis</h3>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#00F0FF] prose-strong:text-[#00F0FF]">
                  <Markdown>{analysis}</Markdown>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {questions.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Enter a topic above to generate practice questions</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
