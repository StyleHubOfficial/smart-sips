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
  deepSearch: boolean;
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  
  setQuery: (query: string) => void;
  setQuestionCount: (count: number) => void;
  setSubject: (subject: string) => void;
  setExamType: (examType: string) => void;
  setClassLevel: (classLevel: string) => void;
  setModel: (model: string) => void;
  setViewMode: (viewMode: 'list' | 'grid' | 'box') => void;
  setDifficulty: (difficulty: string) => void;
  setDeepSearch: (deepSearch: boolean) => void;
  setSelectedOption: (questionId: string, option: string) => void;
  generateQuestions: (apiKey: string) => Promise<void>;
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
      deepSearch: false,
      questions: [],
      loading: false,
      selectedOptions: {},
      showSolutions: {},

      setQuery: (query) => set({ query }),
      setQuestionCount: (questionCount) => set({ questionCount }),
      setSubject: (subject) => set({ subject }),
      setExamType: (examType) => set({ examType }),
      setClassLevel: (classLevel) => set({ classLevel }),
      setModel: (model) => set({ model }),
      setViewMode: (viewMode) => set({ viewMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setDeepSearch: (deepSearch) => set({ deepSearch }),
      
      setSelectedOption: (questionId, option) => 
        set((state) => ({
          selectedOptions: { ...state.selectedOptions, [questionId]: option },
          showSolutions: { ...state.showSolutions, [questionId]: true }
        })),

      clearQuestions: () => set({ questions: [], selectedOptions: {}, showSolutions: {} }),

      generateQuestions: async (apiKey) => {
        const { query, questionCount, subject, examType, classLevel, model, difficulty, deepSearch } = get();
        if (!query.trim()) return;

        set({ loading: true, questions: [], selectedOptions: {}, showSolutions: {} });

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
          
          ${deepSearch ? `
            [DEEP RESEARCH & REASONING MODE ENABLED]
            You are an elite educational researcher and pedagogical expert. 
            
            STEP 1: DEEP CONCEPTUAL ANALYSIS
            - Break down the topic into its fundamental principles, common misconceptions, and advanced applications.
            - Analyze the specific requirements for ${examType} at ${classLevel} level.
            - Identify "trap" concepts often tested in competitive exams.

            STEP 2: CROSS-REFERENCE & VALIDATION
            - Simulate a search across high-authority sources (NCERT, MIT OpenCourseWare, Khan Academy, specialized competitive exam portals).
            - Ensure the difficulty matches the "${difficulty}" level perfectly.

            STEP 3: QUESTION SYNTHESIS
            - Generate questions that test deep understanding, not just rote memorization.
            - Include a mix of conceptual, numerical (if applicable), and application-based questions.
            - For each question, provide a detailed, step-by-step solution that explains the "why" behind the correct answer.
            - Provide a realistic "Source Link" or reference to a high-quality educational resource for further reading.
          ` : ''}

          Return ONLY a valid JSON array of objects. Each object must have:
          - id: unique string
          - question: string text of the question
          - options: array of 4 strings
          - correctAnswer: string (must match exactly one of the options)
          - solution: string (detailed explanation)
          - sourceLink: string (A valid, authentic URL where this specific question or concept can be found. Do not restrict to examside.com.)
          Do not include markdown formatting like \`\`\`json. Just the raw JSON array.`;

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt
          });
          
          const text = result.text || '';
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedQuestions = JSON.parse(cleanText);
          
          set({ questions: parsedQuestions, loading: false });
        } catch (error) {
          console.error('Error fetching questions:', error);
          set({ loading: false });
          throw error;
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
        deepSearch: state.deepSearch
      }),
    }
  )
);
