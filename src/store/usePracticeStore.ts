import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenAI, Type } from '@google/genai';

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
  dppMode: 'sheet' | 'practice';
  mixUp: boolean;
  sequenceWise: boolean;
  sourceFiles: { name: string, data: string, mimeType: string }[];
  questions: Question[];
  loading: boolean;
  selectedOptions: Record<string, string>;
  showSolutions: Record<string, boolean>;
  showHints: Record<string, boolean>;
  showSourceLinks: boolean;
  stepReveals: Record<string, number>;
  analysis: any | null;
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
  setDppMode: (mode: 'sheet' | 'practice') => void;
  setMixUp: (mix: boolean) => void;
  setSequenceWise: (seq: boolean) => void;
  setSourceFiles: (files: { name: string, data: string, mimeType: string }[]) => void;
  setSelectedOption: (questionId: string, option: string) => void;
  setShowHint: (questionId: string, show: boolean) => void;
  setShowSolution: (questionId: string, show: boolean) => void;
  setShowSourceLinks: (show: boolean) => void;
  setStepReveal: (questionId: string, step: number) => void;
  generateQuestions: (apiKey: string, onChunk?: (questions: Question[]) => void) => Promise<void>;
  generateNextQuestions: (apiKey: string, count: number, onChunk?: (questions: Question[]) => void) => Promise<void>;
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
      model: 'gemini-3-flash-preview',
      viewMode: 'linear',
      difficulty: 'Medium',
      isPYQ: false,
      pyqYear: '2024',
      questionType: 'Mixed',
      examFormat: 'Board exam format',
      isSmartPanelMode: false,
      whiteboardMode: 'none',
      isSourceConverterMode: false,
      dppMode: 'practice',
      mixUp: false,
      sequenceWise: true,
      sourceFiles: [],
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
      setDppMode: (dppMode) => set({ dppMode }),
      setMixUp: (mixUp) => set({ mixUp }),
      setSequenceWise: (sequenceWise) => set({ sequenceWise }),
      setSourceFiles: (sourceFiles) => set({ sourceFiles }),
      
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
        const { query, questionCount, subject, examType, classLevel, model, difficulty, isPYQ, pyqYear, questionType, examFormat, sourceFiles, isSourceConverterMode, mixUp, sequenceWise, dppMode } = get();
        if (!query.trim() && sourceFiles.length === 0) return;

        set({ loading: true, questions: [], selectedOptions: {}, showSolutions: {}, showHints: {}, analysis: null });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
          set({ model: selectedModel }); // Update store to valid model
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let prompt = "";
          
          if (isSourceConverterMode && sourceFiles.length > 0) {
            prompt = `You are an expert educational content analyzer and question generator.
            [TASK]
            1. ANALYZE the provided source material(s) (PDF/Image/Text).
            2. GENERATE exactly ${questionCount} questions based ONLY on the content of these sources.
            3. If the source materials do not have enough content for ${questionCount} unique questions, generate the maximum possible number of high-quality questions instead.
            4. ${sequenceWise ? 'Maintain the SEQUENCE of the content as it appears in the sources.' : 'MIX UP the order of concepts for a more challenging set.'}
            5. Question Type: ${questionType}
            6. Difficulty Level: ${difficulty}
            
            [CONSTRAINTS]
            - DO NOT include any information not present in the sources.
            - If the sources contain notes, convert them into conceptual and application-based questions.
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
            ${!isPYQ && !isSourceConverterMode && dppMode === 'sheet' ? 'THIS IS FOR A PRINTABLE PRACTICE SHEET. Ensure questions are formatted well for reading on paper.' : ''}
            
            The questions must be authentic and well-balanced (including conceptual, numerical, diagram-based, and application questions where applicable).
            Ensure the questions are searched well and are from correct, authentic sources.
            
            ${sourceFiles.length > 0 ? `
              [SOURCE MATERIAL(S) PROVIDED]
              You have been provided with ${sourceFiles.length} source file(s). You MUST extract concepts, facts, and information from these sources to generate the questions.
              Ensure the questions accurately reflect the content of the uploaded documents.
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
          
          sourceFiles.forEach(file => {
            contents.push({
              inlineData: {
                data: file.data,
                mimeType: file.mimeType
              }
            });
          });
          
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

      generateNextQuestions: async (apiKey, count, onChunk) => {
        const { query, subject, examType, classLevel, model, difficulty, isPYQ, pyqYear, questionType, examFormat, sourceFiles, isSourceConverterMode, mixUp, sequenceWise, dppMode, questions } = get();
        if (!query.trim() && sourceFiles.length === 0) return;

        // We don't clear questions, we append to them
        set({ loading: true });

        let selectedModel = model;
        const validModels = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
          set({ model: selectedModel });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let prompt = "";
          
          if (isSourceConverterMode && sourceFiles.length > 0) {
            prompt = `You are an expert educational content analyzer and question generator.
            [TASK]
            1. ANALYZE the provided source material(s) (PDF/Image/Text).
            2. GENERATE exactly ${count} MORE questions based ONLY on the content of these sources.
            3. Ensure these new questions are DIFFERENT from the previous ones.
            4. ${sequenceWise ? 'Maintain the SEQUENCE of the content as it appears in the sources.' : 'MIX UP the order of concepts for a more challenging set.'}
            5. Question Type: ${questionType}
            6. Difficulty Level: ${difficulty}
            
            [CONSTRAINTS]
            - DO NOT include any information not present in the sources.
            - If the sources contain notes, convert them into conceptual and application-based questions.
            - Ensure questions are authentic and pedagogically sound.`;
          } else {
            prompt = `Generate ${count} MORE questions based on this request: "${query}". 
            Subject: ${subject}
            Exam Type: ${examType}
            Class Level: ${classLevel}
            Difficulty Level: ${difficulty}
            Question Type: ${questionType}
            Exam Format: ${examFormat}
            ${isPYQ ? `THIS IS A PYQ REQUEST. Generate authentic Previous Year Questions from the year ${pyqYear}.` : ''}
            ${!isPYQ && !isSourceConverterMode && dppMode === 'sheet' ? 'THIS IS FOR A PRINTABLE PRACTICE SHEET. Ensure questions are formatted well for reading on paper.' : ''}
            
            The questions must be authentic and well-balanced.
            Ensure these new questions are DIFFERENT from the previous ones you generated for this topic.
            Ensure the questions are searched well and are from correct, authentic sources.`;
          }

          const contents = [];
          
          if (isSourceConverterMode && sourceFiles.length > 0) {
            for (const file of sourceFiles) {
              contents.push({
                inlineData: {
                  data: file.data,
                  mimeType: file.mimeType || 'application/pdf'
                }
              });
            }
          }
          
          contents.push({ text: prompt });

          const responseStream = await ai.models.generateContentStream({
            model: selectedModel,
            contents: { parts: contents },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    hints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sourceLinks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["id", "question", "options", "correctAnswer", "explanation", "difficulty", "topic"]
                }
              }
            }
          });

          let fullText = '';
          let lastParsedCount = 0;
          const currentQuestions = [...questions];

          for await (const chunk of responseStream) {
            const c = chunk as any;
            if (c.text) {
              fullText += c.text;
              try {
                const partialJson = fullText.trim();
                let objects = [];
                
                if (partialJson.startsWith('[')) {
                  if (partialJson.endsWith(']')) {
                    objects = JSON.parse(partialJson);
                  } else {
                    const lastValidBracket = partialJson.lastIndexOf('}');
                    if (lastValidBracket > 0) {
                      const validJsonString = partialJson.substring(0, lastValidBracket + 1) + ']';
                      objects = JSON.parse(validJsonString);
                    }
                  }
                }

                if (objects.length > lastParsedCount) {
                  lastParsedCount = objects.length;
                  const newQuestions = [...currentQuestions, ...objects];
                  set({ questions: newQuestions });
                  if (onChunk) onChunk(newQuestions);
                }
              } catch (e) {
                // Ignore parse errors during streaming
              }
            }
          }

          if (fullText) {
            let parsedQuestions = [];
            try {
               parsedQuestions = JSON.parse(fullText.trim());
            } catch (parseError) {
               console.error("JSON Parse Error:", parseError, fullText);
               throw new Error("Failed to parse questions from AI response.");
            }
            
            set({ questions: [...currentQuestions, ...parsedQuestions], loading: false });
          }
        } catch (error) {
          console.error('Error fetching next questions:', error);
          set({ loading: false });
          throw error;
        }
      },

      generateSimilarQuestions: async (apiKey, question, type) => {
        const { subject, examType, classLevel, model, difficulty, questionType, examFormat } = get();
        
        // Don't set global loading to true to avoid clearing current questions
        // set({ loading: true }); 

        let selectedModel = model;
        const validModels = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
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

        // Use a fast model for analysis
        let selectedModel = 'gemini-3.1-flash-lite-preview';

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const performanceData = questions.map(q => ({
            question: q.question,
            topic: q.topicTag,
            difficulty: q.difficultyBadge,
            isCorrect: selectedOptions[q.id] === q.correctAnswer
          }));

          const prompt = `Analyze the following student performance data and provide a structured analysis.
          
          Performance Data:
          ${JSON.stringify(performanceData, null, 2)}
          
          Return ONLY a valid JSON object with the following structure:
          {
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "suggestion": "A brief, encouraging overall advice string",
            "recommendedQuestions": ["topic/question type 1", "topic/question type 2", "topic/question type 3", "topic/question type 4", "topic/question type 5"]
          }`;

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          
          try {
            const parsedAnalysis = JSON.parse(result.text || '{}');
            set({ analysis: parsedAnalysis, analyzing: false });
          } catch (e) {
            console.error("Failed to parse analysis JSON", e);
            set({ analyzing: false, analysis: null });
          }
        } catch (error) {
          console.error('Error analyzing score:', error);
          set({ analyzing: false, analysis: null });
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
