import { GoogleGenAI, Type } from '@google/genai';

export interface CoPilotSuggestion {
  toolName: string;
  description: string;
  toolId: string;
  previewIcon: string;
  autoFillQuery: string;
}

export interface ContentAnalysis {
  topic: string;
  keyConcepts: string[];
  formulas: string[];
  definitions: string[];
  diagrams: string[];
  experimentReferences: string[];
  suggestions: CoPilotSuggestion[];
}

export async function analyzeContentForCoPilot(
  content: string,
  fileName: string,
  apiKey: string
): Promise<ContentAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const isUrl = content.startsWith('http');

  const prompt = `
    Analyze the following educational content and provide a structured analysis for a "Classroom Co-Pilot" system.
    Content Source: ${fileName}
    ${isUrl ? `Content URL: ${content}` : `Content Body: ${content}`}

    Extract the following:
    1. Topic: The main subject or lesson.
    2. Key Concepts: List of main ideas.
    3. Formulas: Any mathematical or scientific formulas found.
    4. Definitions: Key terms and their meanings.
    5. Diagrams: Descriptions of visual aids that would help.
    6. Experiment References: Any mentions of lab work or practicals.

    Based on this analysis, suggest at least 5 educational tools that can be generated from this content.
    Available Tools:
    - visualizer: Concept Visualizer (Interactive visual explanations)
    - simulator: Virtual Laboratory Simulation (Interactive 2D/3D experiments)
    - flowchart: Concept Map (Mermaid mindmap/flowchart)
    - practice: Practice Questions (MCQs and descriptive)
    - diagram: Diagram Generator (SVG diagrams)
    - solution: Step-by-Step Solution (For problems)
    - quiz: Interactive assessment
    - summary: Concise revision notes
    - board: Board Exam Questions (Previous year style)

    Respond ONLY in JSON format following this schema:
    {
      "topic": "string",
      "keyConcepts": ["string"],
      "formulas": ["string"],
      "definitions": ["string"],
      "diagrams": ["string"],
      "experimentReferences": ["string"],
      "suggestions": [
        {
          "toolName": "string",
          "description": "string",
          "toolId": "string (one of: visualizer, simulator, flowchart, practice, diagram, solution, quiz, summary, board)",
          "previewIcon": "string (lucide icon name)",
          "autoFillQuery": "string (a detailed prompt to generate this specific tool based on the content)"
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: isUrl ? [{ urlContext: {} }] : undefined,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
          formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
          definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
          diagrams: { type: Type.ARRAY, items: { type: Type.STRING } },
          experimentReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                toolName: { type: Type.STRING },
                description: { type: Type.STRING },
                toolId: { type: Type.STRING },
                previewIcon: { type: Type.STRING },
                autoFillQuery: { type: Type.STRING }
              },
              required: ['toolName', 'description', 'toolId', 'previewIcon', 'autoFillQuery']
            }
          }
        },
        required: ['topic', 'keyConcepts', 'formulas', 'definitions', 'diagrams', 'experimentReferences', 'suggestions']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error('Failed to analyze content');
  return JSON.parse(text) as ContentAnalysis;
}
