import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  interactiveData: any | null;
  loading: boolean;
  model: string;
  chartType: string;
  savedCharts: FlowChart[];
  sourceFile: { name: string; data: string; mimeType: string } | null;
  setQuery: (query: string) => void;
  setGeneratedCode: (code: string) => void;
  setModel: (model: string) => void;
  setChartType: (type: string) => void;
  setSourceFile: (file: { name: string; data: string; mimeType: string } | null) => void;
  generateFlowChart: (apiKey: string) => Promise<void>;
  saveCurrentChart: () => void;
  deleteChart: (id: string) => void;
  loadChart: (chart: FlowChart) => void;
}

export const useFlowChartStore = create<FlowChartState>()(
  persist(
    (set, get) => ({
      query: '',
      generatedCode: '',
      interactiveData: null,
      loading: false,
      model: 'gemini-2.5-flash',
      chartType: 'Flowchart',
      savedCharts: [],
      sourceFile: null,

      setQuery: (query) => set({ query }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      setModel: (model) => set({ model }),
      setChartType: (chartType) => set({ chartType }),
      setSourceFile: (sourceFile) => set({ sourceFile }),

      generateFlowChart: async (apiKey) => {
        const { query, model, chartType, sourceFile } = get();
        if (!query.trim() && !sourceFile) return;
        
        set({ loading: true });

        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let prompt = '';
          let responseMimeType: 'text/plain' | 'application/json' = 'text/plain';

          if (chartType === 'Concept Map') {
            responseMimeType = 'application/json';
            prompt = `
              You are an expert at creating hierarchical concept maps.
              Create a detailed, logical concept map for the following topic: "${query}".
              
              Return a JSON object representing a tree structure:
              {
                "id": "root",
                "label": "Main Topic",
                "description": "Brief overview",
                "children": [
                  {
                    "id": "child1",
                    "label": "Sub-concept",
                    "description": "Explanation",
                    "children": [...]
                  }
                ]
              }
              Make it deep and comprehensive (at least 3-4 levels).
            `;
          } else if (chartType === 'Mind Map') {
            prompt = `
              You are an expert at creating Mermaid.js mindmaps.
              Create a detailed, logical mindmap for the following topic: "${query}".
              
              Requirements:
              1. Use Mermaid.js syntax (starting with "mindmap").
              2. Make it comprehensive and easy to understand.
              3. Use descriptive node labels.
              4. Organize hierarchically from the central topic.
              
              Return ONLY the Mermaid.js code block. Do not include any other text.
            `;
          } else if (chartType === 'Sequence Diagram') {
            prompt = `
              You are an expert at creating Mermaid.js sequence diagrams.
              Create a detailed, logical sequence diagram for the following process/interaction: "${query}".
              
              Requirements:
              1. Use Mermaid.js syntax (starting with "sequenceDiagram").
              2. Make it comprehensive and easy to understand.
              3. Use descriptive participant names and messages.
              4. Include alt/opt blocks if there are conditional paths.
              
              Return ONLY the Mermaid.js code block. Do not include any other text.
            `;
          } else if (chartType === 'State Diagram') {
            prompt = `
              You are an expert at creating Mermaid.js state diagrams.
              Create a detailed, logical state diagram for the following system/process: "${query}".
              
              Requirements:
              1. Use Mermaid.js syntax (starting with "stateDiagram-v2").
              2. Make it comprehensive and easy to understand.
              3. Clearly define states and transitions.
              
              Return ONLY the Mermaid.js code block. Do not include any other text.
            `;
          } else if (chartType === 'Cheat Sheet (Class Diagram)') {
            prompt = `
              You are an expert at creating Mermaid.js class diagrams to act as cheat sheets.
              Create a detailed, logical class diagram/cheat sheet for the following topic: "${query}".
              
              Requirements:
              1. Use Mermaid.js syntax (starting with "classDiagram").
              2. Use classes to represent core concepts, and attributes/methods to list key facts, formulas, or rules.
              3. Make it comprehensive and easy to understand.
              
              Return ONLY the Mermaid.js code block. Do not include any other text.
            `;
          } else {
            prompt = `
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
          }

          const parts: any[] = [{ text: prompt }];
          
          if (sourceFile) {
            parts.push({
              inlineData: {
                mimeType: sourceFile.mimeType,
                data: sourceFile.data
              }
            });
            parts[0].text += `\n\nUse the attached file as context/reference for the diagram structure or content.`;
          }

          const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: responseMimeType === 'application/json' ? { responseMimeType } : undefined
          });

          let code = response.text || '';
          
          if (responseMimeType === 'application/json') {
            try {
              const data = JSON.parse(code);
              set({ interactiveData: data, generatedCode: '', loading: false });
            } catch (e) {
              console.error('Failed to parse interactive data', e);
              set({ generatedCode: code, interactiveData: null, loading: false });
            }
          } else {
            // Clean up markdown code blocks if present
            code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            set({ generatedCode: code, interactiveData: null, loading: false });
          }
        } catch (error) {
          console.error('Error generating flowchart:', error);
          set({ loading: false });
          throw error;
        }
      },

  saveCurrentChart: () => {
    const { query, generatedCode, chartType, savedCharts } = get();
    if (!generatedCode) return;

    const newChart: FlowChart = {
      id: Math.random().toString(36).substring(7),
      title: query || `Untitled ${chartType}`,
      mermaidCode: generatedCode,
      description: `${chartType} for ${query}`,
      timestamp: Date.now(),
    };

    const updated = [newChart, ...savedCharts];
    set({ savedCharts: updated });
  },

  deleteChart: (id) => {
    const updated = get().savedCharts.filter(c => c.id !== id);
    set({ savedCharts: updated });
  },

  loadChart: (chart) => {
    set({ 
      query: chart.title,
      generatedCode: chart.mermaidCode 
    });
  },
    }),
    {
      name: 'sunrise-flowchart-storage',
      partialize: (state) => ({ 
        model: state.model,
        chartType: state.chartType,
        savedCharts: state.savedCharts
      }),
    }
  )
);
