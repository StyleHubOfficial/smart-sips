import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Helper function to call OpenRouter
async function callOpenRouter(model: string, systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://smart-sunrise.vercel.app", // Optional, for OpenRouter rankings
      "X-Title": "Smart Sunrise", // Optional, for OpenRouter rankings
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 1. Search PYQ
router.post("/search-pyq", async (req, res) => {
  try {
    const { exam, subject, topic, year } = req.body;
    
    const systemPrompt = `You are an intelligent search agent for an educational platform. 
    Generate 3 highly optimized Google search queries to find previous year questions (PYQs) for the given parameters.
    Return ONLY a JSON array of strings.`;
    
    const userPrompt = `Exam: ${exam}, Subject: ${subject}, Topic: ${topic}, Year: ${year || 'Any'}`;
    
    const result = await callOpenRouter("qwen/qwen-2.5-72b-instruct", systemPrompt, userPrompt);
    
    // Parse the JSON array
    let queries = [];
    try {
      const jsonMatch = result.match(/\[.*\]/s);
      if (jsonMatch) {
         queries = JSON.parse(jsonMatch[0]);
      } else {
         queries = JSON.parse(result);
      }
    } catch (e) {
      // Fallback
      queries = [
        `${exam} ${year || ''} ${subject} ${topic} previous year questions`,
        `${exam} ${topic} questions pdf solved`,
      ];
    }

    // In a real implementation, we would use a Search API (like Google Custom Search or Serper.dev) here.
    // For this prototype, we will return mock search results based on the queries.
    const mockResults = [
      { url: "https://example.com/jee-2019-physics.pdf", title: `${exam} ${year || '2019'} ${subject} Paper`, type: "pdf" },
      { url: "https://example.com/questions/1", title: `${topic} Important Questions`, type: "html" }
    ];

    res.json({ queries, results: mockResults });
  } catch (error: any) {
    console.error("Search PYQ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Extract Questions
router.post("/extract-questions", async (req, res) => {
  try {
    const { text, sourceUrl } = req.body;
    
    const systemPrompt = `You are an expert educational data extractor. 
    Extract exam questions from the provided text. Clean the text (remove ads, page numbers, watermarks).
    Classify each question's difficulty (Easy, Medium, Hard, Advanced).
    Return a JSON array of objects with this exact structure:
    {
      "question_id": "unique_string",
      "exam": "string",
      "year": "string",
      "subject": "string",
      "topic": "string",
      "subtopic": "string",
      "difficulty": "Easy|Medium|Hard|Advanced",
      "question_text": "string",
      "source_url": "string"
    }
    Return ONLY valid JSON.`;
    
    const userPrompt = `Source URL: ${sourceUrl}\n\nText to extract from:\n${text.substring(0, 4000)}`; // Truncate for safety
    
    const result = await callOpenRouter("qwen/qwen-2.5-72b-instruct", systemPrompt, userPrompt);
    
    let questions = [];
    try {
      const jsonMatch = result.match(/\[.*\]/s);
      if (jsonMatch) {
         questions = JSON.parse(jsonMatch[0]);
      } else {
         questions = JSON.parse(result);
      }
    } catch (e) {
      throw new Error("Failed to parse extracted questions JSON");
    }

    res.json({ questions });
  } catch (error: any) {
    console.error("Extract Questions Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate Solution
router.post("/generate-solution", async (req, res) => {
  try {
    const { question_text, subject, topic } = req.body;
    
    const systemPrompt = `You are an expert teacher. Generate a detailed step-by-step solution for the given question.
    Structure your response using Markdown:
    ### Concept Explanation
    ### Relevant Formulas
    ### Step-by-Step Solving
    ### Final Answer
    ### Common Mistakes`;
    
    const userPrompt = `Subject: ${subject}\nTopic: ${topic}\n\nQuestion:\n${question_text}`;
    
    // Using DeepSeek R1 as requested
    const result = await callOpenRouter("deepseek/deepseek-r1", systemPrompt, userPrompt);
    
    res.json({ solution: result });
  } catch (error: any) {
    console.error("Generate Solution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate Similar Questions
router.post("/generate-similar", async (req, res) => {
  try {
    const { question_text, difficulty, concept } = req.body;
    
    const systemPrompt = `You are an expert question setter. Generate 5 similar practice questions based on the provided question.
    Keep the same concept and similar difficulty, but change numerical values or scenarios.
    Return the output in Markdown format, numbered 1 to 5.`;
    
    const userPrompt = `Original Question:\n${question_text}\n\nDifficulty: ${difficulty}\nConcept: ${concept || 'Same as original'}`;
    
    // Using Llama 3.1 8B Instruct as requested
    const result = await callOpenRouter("meta-llama/llama-3.1-8b-instruct", systemPrompt, userPrompt);
    
    res.json({ similar_questions: result });
  } catch (error: any) {
    console.error("Generate Similar Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
