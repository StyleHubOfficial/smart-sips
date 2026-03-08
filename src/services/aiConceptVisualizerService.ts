import { GoogleGenAI, Type, Modality } from '@google/genai';
import { VisualizerData } from '../store/useConceptVisualizerStore';

export async function generateConceptVisualization(
  query: string,
  sourceFile: { name: string; data: string; mimeType: string } | null,
  modelName: string,
  apiKey: string
): Promise<VisualizerData & { audioData?: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert science and math teacher. Your goal is to explain the following concept visually and interactively.
Concept/Query: ${query}

Provide a structured JSON response with the following:
1. "topic": The main topic name.
2. "explanation": A concise, easy-to-understand explanation of the concept (board-style).
3. "diagramSvg": A valid SVG string representing a diagram of the concept. Make it clean, modern, and use dark theme colors (e.g., #0f172a background, #00F0FF accents, white text). Ensure it has a viewBox and is responsive. If a diagram is not applicable, leave it empty.
4. "formulas": An array of key formulas related to the concept. Each item should have "formula" (LaTeX format or plain text) and "explanation".
5. "realLifeExamples": An array of real-life applications of the concept. Each item should have "title" and "description".
6. "audioScript": A script for an audio narration explaining the concept step-by-step to a student. IMPORTANT: Write this script in "Hinglish" (a natural mix of Hindi and English).
  `;

  const parts: any[] = [{ text: prompt }];

  if (sourceFile) {
    parts.unshift({
      inlineData: {
        data: sourceFile.data,
        mimeType: sourceFile.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          explanation: { type: Type.STRING },
          diagramSvg: { type: Type.STRING },
          animationCode: { type: Type.STRING, description: "A self-contained HTML/JS/CSS snippet for a small interactive animation of the concept." },
          formulas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                formula: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['formula', 'explanation'],
            },
          },
          realLifeExamples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
          },
          audioScript: { type: Type.STRING },
          highlightingSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The text to highlight during this step of the audio explanation." },
                startTime: { type: Type.NUMBER, description: "The start time in seconds for this highlight." },
                endTime: { type: Type.NUMBER, description: "The end time in seconds for this highlight." }
              },
              required: ['text', 'startTime', 'endTime']
            }
          }
        },
        required: ['topic', 'explanation', 'formulas', 'realLifeExamples', 'audioScript', 'highlightingSteps', 'animationCode'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  const result = JSON.parse(text) as VisualizerData;

  // Generate Audio Data
  let audioData = "";
  try {
    const audioResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Explain this concept in a friendly Hinglish tone: ${result.audioScript}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (err) {
    console.error("Audio generation failed in Visualizer:", err);
  }

  return { ...result, audioData };
}
