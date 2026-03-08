import { create } from 'zustand';

export interface VisualizerData {
  topic: string;
  explanation: string;
  diagramSvg?: string;
  animationCode?: string;
  formulas: { formula: string; explanation: string }[];
  realLifeExamples: { title: string; description: string }[];
  audioScript?: string;
  highlightingSteps?: { text: string; startTime: number; endTime: number }[];
  audioData?: string;
}

interface ConceptVisualizerState {
  query: string;
  sourceFile: { name: string; data: string; mimeType: string } | null;
  loading: boolean;
  visualizerData: VisualizerData | null;
  model: string;
  setQuery: (query: string) => void;
  setSourceFile: (file: { name: string; data: string; mimeType: string } | null) => void;
  setModel: (model: string) => void;
  generateVisualization: (apiKey: string) => Promise<void>;
}

export const useConceptVisualizerStore = create<ConceptVisualizerState>((set, get) => ({
  query: '',
  sourceFile: null,
  loading: false,
  visualizerData: null,
  model: 'gemini-3-flash-preview',
  setQuery: (query) => set({ query }),
  setSourceFile: (sourceFile) => set({ sourceFile }),
  setModel: (model) => set({ model }),
  generateVisualization: async (apiKey: string) => {
    set({ loading: true, visualizerData: null });
    try {
      const { generateConceptVisualization } = await import('../services/aiConceptVisualizerService');
      const data = await generateConceptVisualization(get().query, get().sourceFile, get().model, apiKey);
      set({ visualizerData: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
