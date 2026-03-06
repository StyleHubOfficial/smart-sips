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
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  
  setQuery: (query: string) => void;
  setQuestionCount: (count: number) => void;
  setSubject: (subject: string) => void;
  setExamType: (examType: string) => void;
  setClassLevel: (classLevel: string) => void;
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
      questions: [],
      loading: false,
      selectedOptions: {},
      showSolutions: {},

      setQuery: (query) => set({ query }),
      setQuestionCount: (questionCount) => set({ questionCount }),
      setSubject: (subject) => set({ subject }),
      setExamType: (examType) => set({ examType }),
      setClassLevel: (classLevel) => set({ classLevel }),
      
      setSelectedOption: (questionId, option) => 
        set((state) => ({
          selectedOptions: { ...state.selectedOptions, [questionId]: option },
          showSolutions: { ...state.showSolutions, [questionId]: true }
        })),

      clearQuestions: () => set({ questions: [], selectedOptions: {}, showSolutions: {} }),

      generateQuestions: async (apiKey) => {
        const { query, questionCount, subject, examType, classLevel } = get();
        if (!query.trim()) return;

        set({ loading: true, questions: [], selectedOptions: {}, showSolutions: {} });

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `Generate ${questionCount} multiple choice questions based on this request: "${query}". 
          Subject: ${subject}
          Exam Type: ${examType}
          Class Level: ${classLevel}
          The questions must be authentic competitive exam questions (like NDA, JEE, NEET, UPSC, etc.) from any reputable source.
          Ensure the questions are searched well and are from correct, authentic sources.
          Return ONLY a valid JSON array of objects. Each object must have:
          - id: unique string
          - question: string text of the question
          - options: array of 4 strings
          - correctAnswer: string (must match exactly one of the options)
          - solution: string (detailed explanation)
          - sourceLink: string (A valid, authentic URL where this specific question or concept can be found. Do not restrict to examside.com.)
          Do not include markdown formatting like \`\`\`json. Just the raw JSON array.`;

          const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        classLevel: state.classLevel
      }),
    }
  )
);
