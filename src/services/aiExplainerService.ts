import { GoogleGenAI, Modality } from '@google/genai';

export async function generateHinglishExplanation(
  topic: string,
  context: string,
  apiKey: string
): Promise<{ text: string; audioData: string | null }> {
  const ai = new GoogleGenAI({ apiKey });

  // 1. Generate Hinglish Text
  const textResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Explain the following concept in "Hinglish" (a natural mix of Hindi and English as spoken in urban India). 
      The explanation should be friendly, clear, and engaging for a student.
      
      Topic: ${topic}
      Context/Code: ${context}
      
      Keep it concise but thorough. Use English for technical terms but Hindi for the conversational flow.
    `,
  });

  const hinglishText = textResponse.text || "Sorry, I couldn't generate an explanation.";

  // 2. Generate Audio using TTS model
  let audioData: string | null = null;
  try {
    const audioResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Explain this in a friendly Hinglish tone: ${hinglishText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly female voice
          },
        },
      },
    });

    audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Audio generation failed:", error);
  }

  return { text: hinglishText, audioData };
}
