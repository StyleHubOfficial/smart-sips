import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenAI } from '@google/genai';

interface SimulatorState {
  query: string;
  generatedCode: string;
  loading: boolean;
  model: string;
  mode: '2d' | '3d';
  savedSimulations: { id: string; title: string; code: string; date: string }[];
  
  subject: 'physics' | 'chemistry';
  sourceFile: { name: string; data: string; mimeType: string } | null;
  
  setQuery: (query: string) => void;
  setGeneratedCode: (code: string) => void;
  setModel: (model: string) => void;
  setMode: (mode: '2d' | '3d') => void;
  setSubject: (subject: 'physics' | 'chemistry') => void;
  setSourceFile: (file: { name: string; data: string; mimeType: string } | null) => void;
  saveCurrentSimulation: () => void;
  deleteSimulation: (id: string) => void;
  loadSimulation: (id: string) => void;
  generateSimulation: (apiKey: string) => Promise<void>;
  clearSimulation: () => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      query: '',
      generatedCode: '',
      loading: false,
      model: 'gemini-2.5-flash',
      mode: '2d',
      subject: 'physics',
      sourceFile: null,
      savedSimulations: [],

      setQuery: (query) => set({ query }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      setModel: (model) => set({ model }),
      setMode: (mode) => set({ mode }),
      setSubject: (subject) => set({ subject }),
      setSourceFile: (sourceFile) => set({ sourceFile }),

      saveCurrentSimulation: () => {
        const { query, generatedCode, savedSimulations } = get();
        if (!generatedCode) return;
        const newSim = {
          id: Math.random().toString(36).substr(2, 9),
          title: query || 'Untitled Simulation',
          code: generatedCode,
          date: new Date().toLocaleDateString()
        };
        set({ savedSimulations: [newSim, ...savedSimulations] });
      },

      deleteSimulation: (id) => {
        set((state) => ({
          savedSimulations: state.savedSimulations.filter(s => s.id !== id)
        }));
      },

      loadSimulation: (id) => {
        const sim = get().savedSimulations.find(s => s.id === id);
        if (sim) {
          set({ generatedCode: sim.code, query: sim.title });
        }
      },

      clearSimulation: () => set({ generatedCode: '', query: '' }),

      generateSimulation: async (apiKey) => {
        const { query, model, mode, subject, sourceFile } = get();
        if (!query.trim() && !sourceFile) return;

        set({ loading: true, generatedCode: '' });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-2.5-flash';
          set({ model: selectedModel });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `
            Create a high-fidelity, interactive "AI Virtual Laboratory" HTML5 simulation for the following concept: "${query}".
            Subject: ${subject.toUpperCase()}
            Mode: ${mode.toUpperCase()} (2D Canvas or 3D Three.js)

            Requirements:
            1. Simulation Engine:
               - If 2D: Use HTML5 Canvas API with high-performance rendering loop.
               - If 3D: Use Three.js (CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
            2. Interactive Parameters Panel:
               - Create a sleek, glassmorphism-style floating panel with sliders and toggles.
               - Variables for Physics: gravity, mass, velocity, voltage, resistance, etc.
               - Variables for Chemistry: temperature, concentration, reaction rate, catalyst, etc.
            3. Real-time Graph Panel:
               - Implement a dynamic graph using Canvas or a lightweight library (like Chart.js via CDN: https://cdn.jsdelivr.net/npm/chart.js) showing real-time data (e.g., velocity vs time, concentration vs time).
            4. Visuals:
               - Premium dark-themed interface with glowing effects, particle systems for reactions, and smooth transitions.
               - Large, smart-panel optimized controls (easy to touch/click).
            5. Features:
               - "Theory" section explaining the scientific principles.
               - "Controls" guide.
               - Reset, Play/Pause, and Step-by-Step execution.
               - Fullscreen mode support.
            6. Code Structure:
               - Self-contained single HTML file with CSS and JS.
               - Responsive design for smart panels, desktop, and mobile.
            
            Return ONLY the raw HTML code. Do not wrap it in markdown code blocks.
          `;

          const parts: any[] = [{ text: prompt }];
          
          if (sourceFile) {
            parts.push({
              inlineData: {
                mimeType: sourceFile.mimeType,
                data: sourceFile.data
              }
            });
            parts[0].text += `\n\nUse the attached file as the primary context/reference for the simulation logic and parameters.`;
          }

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: [{ role: 'user', parts }]
          });
          
          const text = result.text || '';
          const cleanText = text.replace(/```html/g, '').replace(/```/g, '').trim();
          
          set({ generatedCode: cleanText, loading: false });
        } catch (error) {
          console.error('Error generating simulation:', error);
          set({ loading: false });
          throw error;
        }
      }
    }),
    {
      name: 'sunrise-simulator-storage',
      partialize: (state) => ({ 
        query: state.query,
        model: state.model,
        mode: state.mode,
        subject: state.subject
      }),
    }
  )
);
