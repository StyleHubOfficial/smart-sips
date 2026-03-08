import { create } from 'zustand';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  type: string;
}

interface CoPilotState {
  isModalOpen: boolean;
  selectedContent: any | null;
  extractedData: any | null;
  isAnalyzing: boolean;
  
  openModal: (content: any) => void;
  closeModal: () => void;
  setExtractedData: (data: any) => void;
  setIsAnalyzing: (status: boolean) => void;
}

export const useCoPilotStore = create<CoPilotState>((set) => ({
  isModalOpen: false,
  selectedContent: null,
  extractedData: null,
  isAnalyzing: false,
  
  openModal: (content) => set({ isModalOpen: true, selectedContent: content, extractedData: null, isAnalyzing: true }),
  closeModal: () => set({ isModalOpen: false, selectedContent: null, extractedData: null, isAnalyzing: false }),
  setExtractedData: (data) => set({ extractedData: data }),
  setIsAnalyzing: (status) => set({ isAnalyzing: status }),
}));
