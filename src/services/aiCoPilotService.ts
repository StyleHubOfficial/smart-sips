import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey as string });

export const analyzeContent = async (contentUrl: string, fileType: string, title: string) => {
  try {
    // In a real scenario, we would download the file and send its contents to Gemini.
    // For this prototype, we'll simulate the analysis based on the title and file type,
    // or if it's text/html, we could fetch it.
    // Since we are in an iframe, fetching external URLs might have CORS issues unless it's our own Cloudinary.
    
    let prompt = `Analyze the following educational content titled "${title}" (Type: ${fileType}).
    Extract the following information:
    - topic
    - key concepts
    - formulas
    - definitions
    - experiment references
    
    Based on this, suggest which of the following educational tools would be most appropriate to generate:
    - Concept Visualizer
    - Virtual Laboratory Simulation
    - Concept Map
    - Practice Questions
    - Diagram Generator
    - Quiz
    - Summary Notes
    
    Return the response in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
            definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
            experimentReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTools: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  toolName: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["toolName", "reason"]
              }
            }
          },
          required: ["topic", "keyConcepts", "suggestedTools"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error analyzing content:", error);
    return null;
  }
};
