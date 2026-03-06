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
  
  setQuery: (query: string) => void;
  setGeneratedCode: (code: string) => void;
  setModel: (model: string) => void;
  setMode: (mode: '2d' | '3d') => void;
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
      model: 'gemini-3-flash-preview',
      mode: '2d',
      savedSimulations: [],

      setQuery: (query) => set({ query }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      setModel: (model) => set({ model }),
      setMode: (mode) => set({ mode }),

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
        const { query, model, mode } = get();
        if (!query.trim()) return;

        set({ loading: true, generatedCode: '' });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-3-flash-preview';
          set({ model: selectedModel });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `Create a high-fidelity, interactive HTML ${mode.toUpperCase()} simulation for the following concept: "${query}".
          
          Requirements:
          1. Use standard HTML5, CSS3, and JavaScript.
          2. For 2D, use the HTML5 Canvas API.
          3. For 3D, use Three.js (load via CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
          4. The simulation must be highly interactive with a "Parameters" panel (using HTML/CSS) that allows users to adjust variables (e.g., speed, mass, gravity, color) in real-time.
          5. Implement "Save State" and "Load State" functionality using localStorage within the simulation.
          6. Include a professional "Controls" overlay and a "Theory" section explaining the concept.
          7. Visuals: Use a premium, dark-themed aesthetic with glowing effects, smooth transitions, and high-quality typography.
          8. Performance: Optimize the rendering loop for 60FPS. Handle window resizing perfectly.
          9. Add advanced effects: Particle systems, motion blur, or shaders where appropriate.
          10. The code must be self-contained in a single HTML string.
          
          Return ONLY the raw HTML code. Do not wrap it in markdown code blocks.`;

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt
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
        mode: state.mode
      }),
    }
  )
);
