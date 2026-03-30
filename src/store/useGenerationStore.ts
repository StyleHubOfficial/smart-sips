import { create } from 'zustand';
import { GoogleGenAI } from '@google/genai';

export interface GenerationTask {
  id: string;
  contentId: string;
  toolId: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  result?: any;
  error?: string;
  query: string;
}

interface GenerationState {
  tasks: GenerationTask[];
  addTask: (contentId: string, toolId: string, query: string) => void;
  updateTask: (id: string, updates: Partial<GenerationTask>) => void;
  getTask: (contentId: string, toolId: string) => GenerationTask | undefined;
  startGeneration: (contentId: string, toolId: string, query: string, apiKey: string) => Promise<void>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  tasks: [],
  
  addTask: (contentId, toolId, query) => {
    const id = `${contentId}-${toolId}`;
    if (get().tasks.find(t => t.id === id)) return;
    
    set((state) => ({
      tasks: [...state.tasks, { id, contentId, toolId, status: 'pending', query }]
    }));
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  },

  getTask: (contentId, toolId) => {
    return get().tasks.find(t => t.contentId === contentId && t.toolId === toolId);
  },

  startGeneration: async (contentId, toolId, query, apiKey) => {
    const id = `${contentId}-${toolId}`;
    const existingTask = get().tasks.find(t => t.id === id);
    
    if (existingTask && (existingTask.status === 'generating' || existingTask.status === 'completed')) {
      return;
    }

    if (!existingTask) {
      get().addTask(contentId, toolId, query);
    }

    get().updateTask(id, { status: 'generating' });

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Correct pattern for Gemini 3 models
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query
      });
      
      const text = response.text;
      
      get().updateTask(id, { status: 'completed', result: text });
    } catch (error: any) {
      console.error(`Generation failed for ${toolId}:`, error);
      get().updateTask(id, { status: 'error', error: error.message || 'Generation failed' });
    }
  }
}));
