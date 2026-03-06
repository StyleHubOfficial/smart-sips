import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenAI } from '@google/genai';

interface SimulatorState {
  query: string;
  generatedCode: string;
  loading: boolean;
  model: string;
  mode: '2d' | '3d';
  
  setQuery: (query: string) => void;
  setGeneratedCode: (code: string) => void;
  setModel: (model: string) => void;
  setMode: (mode: '2d' | '3d') => void;
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

      setQuery: (query) => set({ query }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      setModel: (model) => set({ model }),
      setMode: (mode) => set({ mode }),

      clearSimulation: () => set({ generatedCode: '', query: '' }),

      generateSimulation: async (apiKey) => {
        const { query, model, mode } = get();
        if (!query.trim()) return;

        set({ loading: true, generatedCode: '' });

        // Fallback for deprecated/invalid models
        let selectedModel = model;
        const validModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.0-flash'];
        if (!validModels.includes(selectedModel)) {
          selectedModel = 'gemini-3-flash-preview';
          set({ model: selectedModel });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `Create a single-file HTML ${mode.toUpperCase()} simulation for the following concept: "${query}".
          
          Requirements:
          1. Use standard HTML5, CSS3, and JavaScript.
          2. For 2D, use the HTML5 Canvas API.
          3. For 3D, use Three.js (load via CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
          4. The simulation must be interactive (mouse/keyboard controls) and visually appealing.
          5. Include a "Controls" or "Instructions" overlay in the UI.
          6. Make it look premium, modern, and scientific (dark mode preferred).
          7. Ensure the code is self-contained in a single HTML string (CSS in <style>, JS in <script>).
          8. Do NOT use external CSS/JS files other than the Three.js CDN.
          9. Handle window resizing gracefully.
          10. Add smooth animations and particle effects if applicable.
          
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
