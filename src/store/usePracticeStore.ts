import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenAI } from '@google/genai';

export interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  solution: string;
  sourceLink?: string;
  difficultyBadge?: string;
  topicTag?: string;
  hint?: string;
  type?: string;
}

interface PracticeState {
  query: string;
  questionCount: number;
  subject: string;
  examType: string;
  classLevel: string;
  model: string;
  viewMode: 'linear' | 'grid' | 'triple';
  difficulty: string;
  isPYQ: boolean;
  pyqYear: string;
  questionType: string;
  examFormat: string;
  isSmartPanelMode: boolean;
  whiteboardMode: 'none' | 'side' | 'slide';
  sourceFile: { name: string, data: string, mimeType: string } | null;
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  showHints: Record<string, boolean>;
  analysis: string | null;
  analyzing: boolean;
  
  setQuery: (query: string) => void;
  setQuestionCount: (count: number) => void;
  setSubject: (subject: string) => void;
  setExamType: (examType: string) => void;
  setClassLevel: (classLevel: string) => void;
  setModel: (model: string) => void;
  setViewMode: (viewMode: 'linear' | 'grid' | 'triple') => void;
  setDifficulty: (difficulty: string) => void;
  setIsPYQ: (isPYQ: boolean) => void;
  setPyqYear: (year: string) => void;
  setQuestionType: (type: string) => void;
  setExamFormat: (format: string) => void;
  setIsSmartPanelMode: (isSmartPanelMode: boolean) => void;
  setWhiteboardMode: (mode: 'none' | 'side' | 'slide') => void;
  setSourceFile: (file: { name: string, data: string, mimeType: string } | null) => void;
  setSelectedOption: (questionId: string, option: string) => void;
  setShowHint: (questionId: string, show: boolean) => void;
  generateQuestions: (apiKey: string) => Promise<void>;
  analyzeScore: (apiKey: string) => Promise<void>;
  clearQuestions: () => void;
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      query: '',
      questionCount: 10,
      subject: 'General',
      examType: 'General',
      classLevel: 'Class 12',
      model: 'gemini-2.5-flash',
      viewMode: 'linear',
      difficulty: 'Medium',
      isPYQ: false,
      pyqYear: '2024',
      questionType: 'Mixed',
      examFormat: 'Board exam format',
      isSmartPanelMode: false,
      whiteboardMode: 'none',
      sourceFile: null,
      questions: [],
      loading: false,
      selectedOptions: {},
      showSolutions: {},
      showHints: {},
      analysis: null,
      analyzing: false,

      setQuery: (query) => set({ query }),
      setQuestionCount: (questionCount) => set({ questionCount }),
      setSubject: (subject) => set({ subject }),
      setExamType: (examType) => set({ examType }),
      setClassLevel: (classLevel) => set({ classLevel }),
      setModel: (model) => set({ model }),
      setViewMode: (viewMode) => set({ viewMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setIsPYQ: (isPYQ) => set({ isPYQ }),
      setPyqYear: (pyqYear) => set({ pyqYear }),
      setQuestionType: (questionType) => set({ questionType }),
      setExamFormat: (examFormat) => set({ examFormat }),
      setIsSmartPanelMode: (isSmartPanelMode) => set({ isSmartPanelMode }),
      setWhiteboardMode: (whiteboardMode) => set({ whiteboardMode }),
      setSourceFile: (sourceFile) => set({ sourceFile }),
      
      setSelectedOption: (questionId, option) => 
        set((state) => ({
          selectedOptions: { ...state.selectedOptions, [questionId]: option },
          showSolutions: { ...state.showSolutions, [questionId]: true }
        })),

      setShowHint: (questionId, show) =>
        set((state) => ({
          showHints: { ...state.showHints, [questionId]: show }
        })),

      clearQuestions: () => set({ questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, analysis: null }),

      generateQuestions: async (apiKey) => {
        const { query, questionCount, subject, examType, classLevel, model, difficulty, isPYQ, pyqYear, questionType, examFormat, sourceFile } = get();
        if (!query.trim() && !sourceFile) return;

        set({ loading: true, questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, analysis: null });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
          set({ model: selectedModel }); // Update store to valid model
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let prompt = `Generate ${questionCount} questions based on this request: "${query}". 
          Subject: ${subject}
          Exam Type: ${examType}
          Class Level: ${classLevel}
          Difficulty Level: ${difficulty}
          Question Type: ${questionType}
          Exam Format: ${examFormat}
          ${isPYQ ? `THIS IS A PYQ REQUEST. Generate authentic Previous Year Questions from the year ${pyqYear}.` : ''}
          
          The questions must be authentic and well-balanced (including conceptual, numerical, diagram-based, and application questions where applicable).
          Ensure the questions are searched well and are from correct, authentic sources.
          
          ${sourceFile ? `
            [SOURCE MATERIAL PROVIDED]
            You have been provided with a source file. You MUST extract concepts, facts, and information from this source file to generate the questions.
            Ensure the questions accurately reflect the content of the uploaded document.
          ` : ''}

          CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON array of objects. Do not include any conversational text, markdown formatting, or explanations outside the JSON array.
          
          Each object in the array must have EXACTLY these fields:
          - "id": a unique string
          - "question": string text of the question (can use markdown, include diagram descriptions if needed)
          - "options": array of strings (provide exactly 4 options if it's an MCQ, otherwise leave empty array [])
          - "correctAnswer": string (must match exactly one of the options for MCQ, or the exact answer string for others)
          - "solution": string (detailed step-by-step explanation, can use markdown)
          - "sourceLink": string (A valid, authentic URL where this specific question or concept can be found)
          - "difficultyBadge": string (e.g., "Easy", "Medium", "Hard", "HOTS")
          - "topicTag": string (e.g., "Kinematics", "Organic Chemistry")
          - "hint": string (a helpful hint to solve the question)
          - "type": string (e.g., "MCQ", "Numerical", "Assertion Reason", "Short Answer")`;

          const contents: any = [];
          
          if (sourceFile) {
            contents.push({
              inlineData: {
                data: sourceFile.data,
                mimeType: sourceFile.mimeType
              }
            });
          }
          
          contents.push({ text: prompt });

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts: contents },
            config: {
              responseMimeType: "application/json",
              tools: isPYQ ? [{ googleSearch: {} }] : undefined
            }
          });
          
          let parsedQuestions = [];
          try {
            const text = result.text || '';
            const match = text.match(/\[[\s\S]*\]/);
            const cleanText = match ? match[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedQuestions = JSON.parse(cleanText);
          } catch (parseError) {
             console.error("JSON Parse Error:", parseError, result.text);
             throw new Error("Failed to parse questions from AI response.");
          }
          
          set({ questions: parsedQuestions, loading: false });
        } catch (error) {
          console.error('Error fetching questions:', error);
          set({ loading: false });
          throw error;
        }
      },

      analyzeScore: async (apiKey) => {
        const { questions, selectedOptions, model } = get();
        if (questions.length === 0 || Object.keys(selectedOptions).length === 0) return;

        set({ analyzing: true });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const performanceData = questions.map(q => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
            userAnswer: selectedOptions[q.id] || 'Not answered',
            isCorrect: selectedOptions[q.id] === q.correctAnswer
          }));

          const prompt = `Analyze the following student performance data on a recent quiz:
          
          ${JSON.stringify(performanceData, null, 2)}
          
          Please provide an advanced score analysis formatted in Markdown. Include:
          1. **Overall Performance Summary**: A brief, encouraging overview of how they did.
          2. **Difficulty Breakdown**: Analyze their performance across different difficulty levels.
          3. **Strong Concepts**: Identify the topics or types of questions they excelled at.
          4. **Weaker Concepts**: Identify the specific areas where they struggled or made mistakes.
          5. **Actionable Advice & Tips**: Provide concrete study tips and strategies to improve on the weaker concepts.
          6. **Suggested Next Steps**: Recommend specific types of questions or topics they should practice next to strengthen their understanding.
          
          Keep the tone constructive, educational, and motivating.`;

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt
          });
          
          set({ analysis: result.text || 'No analysis generated.', analyzing: false });
        } catch (error) {
          console.error('Error analyzing score:', error);
          set({ analyzing: false, analysis: 'Failed to generate analysis. Please try again.' });
        }
      }
    }),
    {
      name: 'sunrise-practice-storage',
      partialize: (state) => ({ 
        subject: state.subject, 
        examType: state.examType, 
        questionCount: state.questionCount,
        classLevel: state.classLevel,
        model: state.model,
        viewMode: state.viewMode,
        difficulty: state.difficulty,
        isPYQ: state.isPYQ,
        pyqYear: state.pyqYear,
        questionType: state.questionType,
        examFormat: state.examFormat,
        isSmartPanelMode: state.isSmartPanelMode
      }),
    }
  )
);
