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
  pyqYear?: string;
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
  isSourceConverterMode: boolean;
  mixUp: boolean;
  sequenceWise: boolean;
  sourceFile: { name: string, data: string, mimeType: string } | null;
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  showHints: Record<string, boolean>;
  showSourceLinks: boolean;
  stepReveals: Record<string, number>;
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
  setIsSourceConverterMode: (isMode: boolean) => void;
  setMixUp: (mix: boolean) => void;
  setSequenceWise: (seq: boolean) => void;
  setSourceFile: (file: { name: string, data: string, mimeType: string } | null) => void;
  setSelectedOption: (questionId: string, option: string) => void;
  setShowHint: (questionId: string, show: boolean) => void;
  setShowSolution: (questionId: string, show: boolean) => void;
  setShowSourceLinks: (show: boolean) => void;
  setStepReveal: (questionId: string, step: number) => void;
  generateQuestions: (apiKey: string, onChunk?: (questions: Question[]) => void) => Promise<void>;
  generateSimilarQuestions: (apiKey: string, question: Question, type: 'ai' | 'pyq' | 'search') => Promise<void>;
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
      isSourceConverterMode: false,
      mixUp: false,
      sequenceWise: true,
      sourceFile: null,
      questions: [],
      loading: false,
      selectedOptions: {},
      showSolutions: {},
      showHints: {},
      showSourceLinks: false,
      stepReveals: {},
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
      setIsSourceConverterMode: (isSourceConverterMode) => set({ isSourceConverterMode }),
      setMixUp: (mixUp) => set({ mixUp }),
      setSequenceWise: (sequenceWise) => set({ sequenceWise }),
      setSourceFile: (sourceFile) => set({ sourceFile }),
      
      setSelectedOption: (questionId, option) => 
        set((state) => ({
          selectedOptions: { ...state.selectedOptions, [questionId]: option }
        })),

      setShowHint: (questionId, show) =>
        set((state) => ({
          showHints: { ...state.showHints, [questionId]: show }
        })),

      setShowSolution: (questionId, show) =>
        set((state) => ({
          showSolutions: { ...state.showSolutions, [questionId]: show }
        })),

      setShowSourceLinks: (show) => set({ showSourceLinks: show }),

      setStepReveal: (questionId, step) =>
        set((state) => ({
          stepReveals: { ...state.stepReveals, [questionId]: step }
        })),

      clearQuestions: () => set({ questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, stepReveals: {}, analysis: null }),

      generateQuestions: async (apiKey, onChunk) => {
        const { query, questionCount, subject, examType, classLevel, model, difficulty, isPYQ, pyqYear, questionType, examFormat, sourceFile, isSourceConverterMode, mixUp, sequenceWise } = get();
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
          
          let prompt = "";
          
          if (isSourceConverterMode && sourceFile) {
            prompt = `You are an expert educational content analyzer and question generator.
            [TASK]
            1. ANALYZE the provided source material (PDF/Image/Text).
            2. GENERATE exactly ${questionCount} questions based ONLY on the content of this source.
            3. If the source material does not have enough content for ${questionCount} unique questions, generate the maximum possible number of high-quality questions instead.
            4. ${sequenceWise ? 'Maintain the SEQUENCE of the content as it appears in the source.' : 'MIX UP the order of concepts for a more challenging set.'}
            5. Question Type: ${questionType}
            6. Difficulty Level: ${difficulty}
            
            [CONSTRAINTS]
            - DO NOT include any information not present in the source.
            - If the source contains notes, convert them into conceptual and application-based questions.
            - Ensure questions are authentic and pedagogically sound.`;
          } else {
            prompt = `Generate ${questionCount} questions based on this request: "${query}". 
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
            ` : ''}`;
          }

          prompt += `
          
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
          - "pyqYear": string (If this is a PYQ, mention the year and exam, e.g., "JEE Main 2024". Otherwise, leave empty string "")
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

          if (onChunk) {
            const stream = await ai.models.generateContentStream({
              model: selectedModel,
              contents: { parts: contents },
              config: {
                responseMimeType: "application/json"
              }
            });

            let fullText = "";
            let lastParsedCount = 0;

            for await (const chunk of stream) {
              fullText += chunk.text || "";
              
              // Try to parse partial JSON array
              try {
                const match = fullText.match(/\[[\s\S]*\]/);
                const jsonText = match ? match[0] : (fullText.startsWith('[') ? fullText : '');
                
                // Very basic partial JSON array parsing
                // We look for complete objects in the array
                const objects = [];
                let braceCount = 0;
                let startIdx = -1;
                
                for (let i = 0; i < jsonText.length; i++) {
                  if (jsonText[i] === '{') {
                    if (braceCount === 0) startIdx = i;
                    braceCount++;
                  } else if (jsonText[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && startIdx !== -1) {
                      try {
                        const obj = JSON.parse(jsonText.substring(startIdx, i + 1));
                        objects.push({
                          ...obj,
                          id: obj.id ? `${obj.id}-${Date.now()}-${objects.length}` : `q-${Date.now()}-${objects.length}`
                        });
                      } catch (e) {
                        // Not a complete object yet
                      }
                    }
                  }
                }

                if (objects.length > lastParsedCount) {
                  lastParsedCount = objects.length;
                  set({ questions: objects });
                  onChunk(objects);
                }
              } catch (e) {
                // Ignore parse errors during streaming
              }
            }
            set({ loading: false });
          } else {
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
              
              // Ensure unique IDs
              if (Array.isArray(parsedQuestions)) {
                parsedQuestions = parsedQuestions.map((q: any, i: number) => ({
                  ...q,
                  id: q.id ? `${q.id}-${Date.now()}-${i}` : `q-${Date.now()}-${i}`
                }));
              }
            } catch (parseError) {
               console.error("JSON Parse Error:", parseError, result.text);
               throw new Error("Failed to parse questions from AI response.");
            }
            
            set({ questions: parsedQuestions, loading: false });
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          set({ loading: false });
          throw error;
        }
      },

      generateSimilarQuestions: async (apiKey, question, type) => {
        const { subject, examType, classLevel, model, difficulty, questionType, examFormat } = get();
        
        // Don't set global loading to true to avoid clearing current questions
        // set({ loading: true }); 

        let selectedModel = model;
        const validModels = ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
        }

        try {
          const genAI = new GoogleGenAI({ apiKey });
          
          let prompt = `
          Generate 5 similar questions based on the following original question:
          
          Original Question: "${question.question}"
          Original Correct Answer: "${question.correctAnswer}"
          Original Topic: "${question.topicTag}"
          Original Difficulty: "${question.difficultyBadge}"
          
          Context:
          Subject: ${subject}
          Exam Type: ${examType}
          Class Level: ${classLevel}
          Difficulty Level: ${difficulty}
          Question Type: ${questionType}
          Exam Format: ${examFormat}
          `;

          if (type === 'pyq') {
            prompt += `\nTHIS IS A PYQ REQUEST. Generate authentic Previous Year Questions that are similar to the original question.`;
          } else if (type === 'search') {
            prompt += `\nUse the googleSearch tool to find recent or real-world examples similar to this question.`;
          } else {
            prompt += `\nGenerate AI-crafted questions that test the same concept but with different values, scenarios, or phrasing.`;
          }

          prompt += `
          
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
          - "pyqYear": string (If this is a PYQ, mention the year and exam, e.g., "JEE Main 2024". Otherwise, leave empty string "")
          - "hint": string (a helpful hint to solve the question)
          - "type": string (e.g., "MCQ", "Numerical", "Assertion Reason", "Short Answer")`;

          const config: any = {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            responseMimeType: "application/json"
          };

          if (type === 'pyq' || type === 'search') {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await genAI.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config
          });

          const text = response.text || '';
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          
          if (!jsonMatch) {
            console.error("Failed to parse JSON from response:", text);
            throw new Error("Invalid response format from AI");
          }

          const generatedQuestions = JSON.parse(jsonMatch[0]).map((q: any, i: number) => ({
            ...q,
            id: `similar-${q.id || 'q'}-${Date.now()}-${i}`,
            pyqYear: q.pyqYear || (type === 'pyq' ? 'PYQ' : '')
          }));

          // Insert similar questions after the original one
          const currentQuestions = get().questions;
          const index = currentQuestions.findIndex(q => q.id === question.id);
          const newQuestions = [...currentQuestions];
          newQuestions.splice(index + 1, 0, ...generatedQuestions);
          
          set({ questions: newQuestions });
        } catch (error) {
          console.error('Error generating similar questions:', error);
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
