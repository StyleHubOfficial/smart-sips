import React, { useState } from 'react';
import { Loader2, Wand2, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AIGeneratorModalProps {
  onClose: () => void;
  onInsert: (content: string) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ onClose, onInsert }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Generate a simple text-based representation of: ${query}. Keep it short and simple.`,
      });
      if (response.text) {
        onInsert(response.text);
        onClose();
      }
    } catch (error) {
      console.error('Error generating object:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-96 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold">AI Object Generator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. A simple flowchart of photosynthesis..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00F0FF]/50 h-32 mb-4 resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !query.trim()}
          className="w-full py-3 rounded-xl bg-[#00F0FF] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          Generate
        </button>
      </div>
    </div>
  );
};
