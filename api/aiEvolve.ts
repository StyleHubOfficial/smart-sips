import express from "express";
import { Octokit } from "@octokit/rest";
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

const FORBIDDEN_FILES = [
  ".env",
  ".env.local",
  "vercel.json",
  "next.config.js",
  "package.json"
];

const ALLOWED_FOLDERS = [
  "/components",
  "/app",
  "/styles",
  "/pages",
  "/src/components",
  "/src/pages",
  "/src/styles",
  "/src/app"
];

const PROMPT_PROTECTION_WORDS = ["env", "token", "secret", "password", "api key"];

router.post("/evolve", async (req, res) => {
  try {
    const { 
      instruction, 
      componentPath, 
      githubToken, 
      repoOwner, 
      repoName, 
      apiKey,
      model = "gemini-3.1-flash-lite-preview"
    } = req.body;

    if (!instruction || !componentPath || !githubToken || !repoOwner || !repoName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Prompt Protection
    const lowerInstruction = instruction.toLowerCase();
    for (const word of PROMPT_PROTECTION_WORDS) {
      if (lowerInstruction.includes(word)) {
        return res.status(403).json({ error: `Security Error: Request contains protected keyword '${word}'` });
      }
    }

    // File Path Validation
    const fileName = path.basename(componentPath);
    if (FORBIDDEN_FILES.includes(fileName)) {
      return res.status(403).json({ error: `Security Error: Modification of ${fileName} is forbidden.` });
    }

    let isAllowedFolder = false;
    for (const folder of ALLOWED_FOLDERS) {
      if (componentPath.startsWith(folder)) {
        isAllowedFolder = true;
        break;
      }
    }

    if (!isAllowedFolder) {
      return res.status(403).json({ error: `Security Error: Modification of files outside allowed folders is forbidden.` });
    }

    const octokit = new Octokit({ auth: githubToken });

    // Verify repository exists and get default branch
    let defaultBranch = "";
    try {
      const { data: repoData } = await octokit.repos.get({
        owner: repoOwner,
        repo: repoName,
      });
      defaultBranch = repoData.default_branch;
    } catch (error: any) {
      if (error.status === 404) {
        return res.status(404).json({ error: "Repository not found or token lacks access.", details: error.message });
      } else if (error.status === 401) {
        return res.status(401).json({ error: "Invalid GitHub token.", details: error.message });
      }
      return res.status(500).json({ error: "Failed to access repository.", details: error.message });
    }

    // Step 3: Fetch current file code from GitHub
    let fileContent = "";
    let fileSha: string | undefined = undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: componentPath.startsWith("/") ? componentPath.substring(1) : componentPath,
      });

      if (!Array.isArray(data) && data.type === "file") {
        fileContent = Buffer.from(data.content, "base64").toString("utf-8");
        fileSha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        return res.status(500).json({ error: "Failed to fetch file from repository.", details: error.message });
      }
      // File doesn't exist, which is fine for new components
    }

    // Step 4 & 5: Construct AI request and send to Gemini
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
    
    const systemPrompt = `You are a senior Next.js developer.
Your task is to modify existing React and Next.js code safely.
Rules:
Return the complete updated code.
Can include explanations or commentary.
Maintain existing functionality unless the request requires modification.
Follow Next.js best practices.
Use Tailwind CSS styling.
Ensure the code compiles correctly.
Never access environment variables(until or unless asked/telled).
Never modify files outside the provided code.`;

    const prompt = `
Admin Instruction: ${instruction}

Current File Code (${componentPath}):
\`\`\`tsx
${fileContent}
\`\`\`

Please provide the updated code. Only return the updated code inside a markdown code block (e.g., \`\`\`tsx ... \`\`\`). Do not include any other text outside the code block if possible, or ensure the code is clearly separated.
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    let updatedCode = response.text || "";
    
    // Extract code from markdown block if present
    const codeMatch = updatedCode.match(/\`\`\`(?:tsx|ts|jsx|js)?\n([\s\S]*?)\`\`\`/);
    if (codeMatch && codeMatch[1]) {
      updatedCode = codeMatch[1];
    }

    // Step 6: Validation (Build checks, ESLint, TypeScript)
    // Write to local file temporarily to run checks
    const localFilePath = path.join(process.cwd(), componentPath.startsWith("/") ? componentPath.substring(1) : componentPath);
    let originalLocalContent = "";
    let fileExistedLocally = true;
    
    try {
      originalLocalContent = await fs.readFile(localFilePath, "utf-8");
    } catch (e) {
      fileExistedLocally = false;
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });
      await fs.writeFile(localFilePath, updatedCode, "utf-8");

      // Run validation
      await new Promise((resolve, reject) => {
        exec("npm run lint", { cwd: process.cwd() }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Validation failed:\n${stdout}\n${stderr}`));
          } else {
            resolve(true);
          }
        });
      });
    } catch (validationError: any) {
      // Revert file
      if (fileExistedLocally) {
        await fs.writeFile(localFilePath, originalLocalContent, "utf-8");
      } else {
        await fs.unlink(localFilePath).catch(() => {});
      }
      return res.status(400).json({ error: "AI generated code failed validation.", details: validationError.message });
    }

    // Revert file after successful validation so we don't mess up the local dev environment
    if (fileExistedLocally) {
      await fs.writeFile(localFilePath, originalLocalContent, "utf-8");
    } else {
      await fs.unlink(localFilePath).catch(() => {});
    }

    // Step 7 & 8: GitHub Automation
    const branchName = `ai-update-${Date.now()}`;
    
    // Get default branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = refData.object.sha;

    // Create branch
    await octokit.git.createRef({
      owner: repoOwner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Update file
    const updateParams: any = {
      owner: repoOwner,
      repo: repoName,
      path: componentPath.startsWith("/") ? componentPath.substring(1) : componentPath,
      message: `AI Update: ${instruction}`,
      content: Buffer.from(updatedCode).toString("base64"),
      branch: branchName,
    };
    if (fileSha) {
      updateParams.sha = fileSha;
    }
    await octokit.repos.createOrUpdateFileContents(updateParams);

    // Create Pull Request
    const { data: prData } = await octokit.pulls.create({
      owner: repoOwner,
      repo: repoName,
      title: `AI Update: ${instruction}`,
      body: `This pull request was automatically generated by the Self-Evolving UI Engine.\n\n**Instruction:** ${instruction}\n**Component:** ${componentPath}`,
      head: branchName,
      base: defaultBranch,
    });

    res.json({ 
      success: true, 
      pullRequestUrl: prData.html_url,
      branchName,
      updatedCode
    });

  } catch (error: any) {
    console.error("AI Evolve Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

export default router;
