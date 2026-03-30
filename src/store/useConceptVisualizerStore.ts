import { create } from 'zustand';

export interface Diagram {
  title: string;
  description: string;
  svgCode: string;
}

export interface VisualizerData {
  topic: string;
  explanation: string;
  diagrams: Diagram[];
}

interface ConceptVisualizerState {
  query: string;
  sourceFile: { name: string; data: string; mimeType: string } | null;
  loading: boolean;
  visualizerData: VisualizerData | null;
  model: string;
  diagramCount: number;
  setQuery: (query: string) => void;
  setSourceFile: (file: { name: string; data: string; mimeType: string } | null) => void;
  setModel: (model: string) => void;
  setDiagramCount: (count: number) => void;
  setVisualizerData: (data: VisualizerData | null) => void;
  generateVisualization: (apiKey: string) => Promise<void>;
}

export const useConceptVisualizerStore = create<ConceptVisualizerState>((set, get) => ({
  query: '',
  sourceFile: null,
  loading: false,
  visualizerData: null,
  model: 'gemini-3-flash-preview',
  diagramCount: 1,
  setQuery: (query) => set({ query }),
  setSourceFile: (sourceFile) => set({ sourceFile }),
  setModel: (model) => set({ model }),
  setDiagramCount: (diagramCount) => set({ diagramCount }),
  setVisualizerData: (visualizerData) => set({ visualizerData }),
  generateVisualization: async (apiKey: string) => {
    set({ loading: true, visualizerData: null });
    try {
      const { generateConceptVisualization } = await import('../services/aiConceptVisualizerService');
      const data = await generateConceptVisualization(get().query, get().sourceFile, get().model, get().diagramCount, apiKey);
      set({ visualizerData: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
