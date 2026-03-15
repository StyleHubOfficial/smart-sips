import { GoogleGenAI, Type } from '@google/genai';
import { VisualizerData } from '../store/useConceptVisualizerStore';

export async function generateConceptVisualization(
  query: string,
  sourceFile: { name: string; data: string; mimeType: string } | null,
  modelName: string,
  diagramCount: number,
  apiKey: string
): Promise<VisualizerData> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert science and math teacher and educational diagram designer.
Your goal is to explain the following concept visually using clean, classroom-friendly diagrams.
Concept/Query: ${query}

[TASK]
1. Generate a concise, easy-to-understand explanation of the concept.
2. Generate EXACTLY ${diagramCount} educational diagrams based on the concept.
3. Each diagram should represent a DIFFERENT interpretation, layout, or aspect of the concept (e.g., concept diagram, process diagram, flow diagram, structure diagram).
4. Diagrams MUST be clean, classroom-friendly, and suitable for teaching.
5. Use labels, arrows, boxes, hierarchies, and flow connections in the diagrams.
6. The diagrams must be provided as valid, self-contained SVG strings.
7. Use dark theme colors for the SVG (e.g., #0f172a background, #00F0FF accents, white text). Ensure it has a viewBox and is responsive.

Provide a structured JSON response with the following:
1. "topic": The main topic name.
2. "explanation": A concise, easy-to-understand explanation of the concept.
3. "diagrams": An array of exactly ${diagramCount} objects, each containing:
   - "title": Title of the diagram.
   - "description": Brief description of what the diagram shows.
   - "svgCode": The valid SVG string for the diagram.
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
          diagrams: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                svgCode: { type: Type.STRING, description: "Valid SVG string representing the diagram." }
              },
              required: ['title', 'description', 'svgCode']
            }
          }
        },
        required: ['topic', 'explanation', 'diagrams'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  const result = JSON.parse(text) as VisualizerData;

  return result;
}

