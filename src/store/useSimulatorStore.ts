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
      model: 'gemini-3-flash-preview',
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
          selectedModel = 'gemini-3-flash-preview';
          set({ model: selectedModel });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `
            Create a top-class, highly professional, and scientifically accurate "AI Virtual Laboratory" HTML5 simulation for the following concept: "${query}".
            Subject: ${subject.toUpperCase()}
            Mode: ${mode.toUpperCase()} (2D Canvas or 3D Three.js)

            CRITICAL LAYOUT INSTRUCTIONS (MANDATORY):
            The output MUST use these EXACT markers to separate sections:
            [SIMULATION_START]
            <section id="simulation-container"> - This must contain the 2D Canvas or 3D Three.js WebGL area. Ensure it is responsive and fills its container.
            [SIMULATION_END]

            [CONTROLS_START]
            <section id="controls-container"> - This must contain all interactive sliders, buttons, and toggles. Use a clean, modern grid layout for controls.
            [CONTROLS_END]

            [THEORY_START]
            <section id="theory-container"> - This must contain the scientific explanation, formulas (use LaTeX-style formatting if possible), and theory. 
            Use <h2> for main headings, <h3> for subheadings, and <ul> for lists. Make it look like a professional textbook page.
            [THEORY_END]

            [CSS_START]
            <style>
              body { margin: 0; background: #0a0a0a; color: #ffffff; font-family: 'Inter', sans-serif; }
              #simulation-container { width: 100%; height: 100%; min-height: 400px; position: relative; overflow: hidden; border-radius: 12px; }
              #controls-container { padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; margin-top: 20px; }
              #theory-container { padding: 30px; background: rgba(255,255,255,0.03); border-left: 4px solid #B026FF; border-radius: 0 16px 16px 0; margin-top: 20px; line-height: 1.6; }
              #theory-container h2 { color: #00F0FF; margin-top: 0; font-size: 1.5rem; }
              #theory-container h3 { color: #B026FF; font-size: 1.1rem; }
              .control-group { margin-bottom: 15px; }
              label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
              input[type="range"] { width: 100%; accent-color: #B026FF; }
              button { background: #B026FF; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
              button:hover { background: #00F0FF; color: #000; }
            </style>
            [CSS_END]

            [JS_START]
            <script>...</script>
            [JS_END]

            DESIGN & PERFORMANCE REQUIREMENTS:
            - UI STYLE: Very very simple, clean, and minimal. Use a dark theme. Use accent colors like #00F0FF (Cyan) and #B026FF (Purple).
            - CONTENT QUALITY: Very very high quality and scientifically accurate. Use real constants and formulas.
            - ANIMATION QUALITY: Very very super smooth. Use requestAnimationFrame. Ensure 60fps+ performance. No lag.
            - DATA VISUALIZATION: Include a real-time graph (Canvas-based) that plots the core variables of the experiment.
            - NO EXTERNAL LIBRARIES except Three.js (if 3D) and Chart.js (if needed for graphs). Use CDNs.

            Return ONLY the raw HTML code containing the embedded CSS and JS. Do not wrap it in markdown code blocks.
            ${sourceFile ? `\n\nIMPORTANT: Use the attached file content as the PRIMARY source of truth for this simulation. The user has provided this specific material to be simulated. Analyze it thoroughly.` : ''}
          `;

          const parts: any[] = [{ text: prompt }];
          
          if (sourceFile) {
            parts.push({
              inlineData: {
                mimeType: sourceFile.mimeType,
                data: sourceFile.data
              }
            });
            parts[0].text += `\n\nUse the attached file as the primary context/reference for the simulation logic and parameters. Analyze the content deeply to ensure the simulation is perfectly aligned with the source material.`;
          }

          const result = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts }
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
