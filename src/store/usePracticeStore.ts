import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenAI } from '@google/genai';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  sourceLink?: string;
}

interface PracticeState {
  query: string;
  questionCount: number;
  subject: string;
  examType: string;
  classLevel: string;
  model: string;
  viewMode: 'list' | 'grid' | 'box';
  difficulty: string;
  sourceFile: { name: string, data: string, mimeType: string } | null;
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  analysis: string | null;
  analyzing: boolean;
  
  setQuery: (query: string) => void;
  setQuestionCount: (count: number) => void;
  setSubject: (subject: string) => void;
  setExamType: (examType: string) => void;
  setClassLevel: (classLevel: string) => void;
  setModel: (model: string) => void;
  setViewMode: (viewMode: 'list' | 'grid' | 'box') => void;
  setDifficulty: (difficulty: string) => void;
  setSourceFile: (file: { name: string, data: string, mimeType: string } | null) => void;
  setSelectedOption: (questionId: string, option: string) => void;
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
      model: 'gemini-3-flash-preview',
      viewMode: 'list',
      difficulty: 'Medium',
      sourceFile: null,
      questions: [],
      loading: false,
      selectedOptions: {},
      showSolutions: {},
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
      setSourceFile: (sourceFile) => set({ sourceFile }),
      
      setSelectedOption: (questionId, option) => 
        set((state) => ({
          selectedOptions: { ...state.selectedOptions, [questionId]: option },
          showSolutions: { ...state.showSolutions, [questionId]: true }
        })),

      clearQuestions: () => set({ questions: [], selectedOptions: {}, showSolutions: {}, analysis: null }),

      generateQuestions: async (apiKey) => {
        const { query, questionCount, subject, examType, classLevel, model, difficulty, sourceFile } = get();
        if (!query.trim() && !sourceFile) return;

        set({ loading: true, questions: [], selectedOptions: {}, showSolutions: {}, analysis: null });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-3-flash-preview';
          set({ model: selectedModel }); // Update store to valid model
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let prompt = `Generate ${questionCount} multiple choice questions based on this request: "${query}". 
          Subject: ${subject}
          Exam Type: ${examType}
          Class Level: ${classLevel}
          Difficulty Level: ${difficulty}
          
          The questions must be authentic competitive exam questions (like NDA, JEE, NEET, UPSC, etc.) from any reputable source.
          Ensure the questions are searched well and are from correct, authentic sources.
          
          ${sourceFile ? `
            [SOURCE MATERIAL PROVIDED]
            You have been provided with a source file. You MUST extract concepts, facts, and information from this source file to generate the questions.
            Ensure the questions accurately reflect the content of the uploaded document.
          ` : ''}

          CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON array of objects. Do not include any conversational text, markdown formatting, or explanations outside the JSON array.
          
          Each object in the array must have EXACTLY these fields:
          - "id": a unique string
          - "question": string text of the question (can use markdown)
          - "options": array of exactly 4 strings (can use markdown)
          - "correctAnswer": string (must match exactly one of the options)
          - "solution": string (detailed explanation, can use markdown)
          - "sourceLink": string (A valid, authentic URL where this specific question or concept can be found. Do not restrict to examside.com.)`;

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
              responseMimeType: "application/json"
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
        const validModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-3-flash-preview';
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
          2. **Strong Concepts**: Identify the topics or types of questions they excelled at.
          3. **Weaker Concepts**: Identify the specific areas where they struggled or made mistakes.
          4. **Actionable Advice & Tips**: Provide concrete study tips and strategies to improve on the weaker concepts.
          5. **Suggested Next Steps**: Recommend specific types of questions or topics they should practice next to strengthen their understanding.
          
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
        difficulty: state.difficulty
      }),
    }
  )
);
