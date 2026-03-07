import { create } from 'zustand';
import { GoogleGenAI } from "@google/genai";

interface FlowChart {
  id: string;
  title: string;
  mermaidCode: string;
  description: string;
  timestamp: number;
}

interface FlowChartState {
  query: string;
  generatedCode: string;
  loading: boolean;
  model: string;
  savedCharts: FlowChart[];
  setQuery: (query: string) => void;
  setGeneratedCode: (code: string) => void;
  setModel: (model: string) => void;
  generateFlowChart: (apiKey: string) => Promise<void>;
  saveCurrentChart: () => void;
  deleteChart: (id: string) => void;
  loadChart: (chart: FlowChart) => void;
}

export const useFlowChartStore = create<FlowChartState>((set, get) => ({
  query: '',
  generatedCode: '',
  loading: false,
  model: 'gemini-3-flash-preview',
  savedCharts: JSON.parse(localStorage.getItem('sunrise_flowcharts') || '[]'),

  setQuery: (query) => set({ query }),
  setGeneratedCode: (generatedCode) => set({ generatedCode }),
  setModel: (model) => set({ model }),

  generateFlowChart: async (apiKey) => {
    const { query, model } = get();
    set({ loading: true });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are an expert at creating Mermaid.js flowcharts.
        Create a detailed, logical flowchart for the following topic: "${query}".
        
        Requirements:
        1. Use Mermaid.js syntax (starting with "graph TD" or "graph LR").
        2. Make it comprehensive and easy to understand.
        3. Use descriptive node labels.
        4. Add subgraphs if necessary to group related steps.
        5. Use different shapes for different types of steps (e.g., diamonds for decisions).
        
        Return ONLY the Mermaid.js code block. Do not include any other text.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });

      let code = response.text || '';
      // Clean up markdown code blocks if present
      code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      
      set({ generatedCode: code, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  saveCurrentChart: () => {
    const { query, generatedCode, savedCharts } = get();
    if (!generatedCode) return;

    const newChart: FlowChart = {
      id: Math.random().toString(36).substring(7),
      title: query || 'Untitled Flowchart',
      mermaidCode: generatedCode,
      description: `Flowchart for ${query}`,
      timestamp: Date.now(),
    };

    const updated = [newChart, ...savedCharts];
    set({ savedCharts: updated });
    localStorage.setItem('sunrise_flowcharts', JSON.stringify(updated));
  },

  deleteChart: (id) => {
    const updated = get().savedCharts.filter(c => c.id !== id);
    set({ savedCharts: updated });
    localStorage.setItem('sunrise_flowcharts', JSON.stringify(updated));
  },

  loadChart: (chart) => {
    set({ 
      query: chart.title,
      generatedCode: chart.mermaidCode 
    });
  },
}));
