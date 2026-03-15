import express from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import aiEvolveRouter from "./aiEvolve.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "de4qwrmmw",
  api_key: process.env.CLOUDINARY_API_KEY || "884247873451835",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YMIVl-hidOuXm0yYkzq7xX0raKg",
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // AI Evolve Route
  app.use("/api/ai", aiEvolveRouter);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Fetch all resources with metadata
  app.get("/api/content", async (req, res) => {
    try {
      console.log("Fetching content from Cloudinary...");
      
      let resources = [];
      try {
        // Try search API first (more powerful, supports context filtering)
        const result = await cloudinary.search
          .expression("folder:sunrise_classroom")
          .with_field("context")
          .sort_by("created_at", "desc")
          .max_results(100)
          .execute();
        resources = result.resources || [];
        console.log(`Search API returned ${resources.length} resources`);
      } catch (searchError: any) {
        console.warn("Cloudinary Search API failed, falling back to basic resources API:", searchError.message);
        
        // Fallback to basic resources API if search is not enabled/supported
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: 'sunrise_classroom/',
          max_results: 100,
          context: true
        });
        resources = result.resources || [];
        console.log(`Basic API returned ${resources.length} resources`);
      }

      res.json({ resources });
    } catch (error: any) {
      console.error("Error fetching content:", error);
      res.status(500).json({ 
        error: "Failed to fetch content", 
        details: error.message,
        code: error.http_code,
        cloudinary_error: error.error?.message
      });
    }
  });

  // Delete content
  app.delete("/api/content", async (req, res) => {
    try {
      const { public_id, resource_type } = req.query;
      
      if (!public_id) {
        return res.status(400).json({ error: "Missing public_id" });
      }

      console.log(`Deleting resource: ${public_id}`);
      const result = await cloudinary.uploader.destroy(public_id as string, { 
        resource_type: resource_type as string || 'image' 
      });
      
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Error deleting content:", error);
      res.status(500).json({ error: "Failed to delete content", details: error.message });
    }
  });

  // Edit content metadata
  app.put("/api/content", async (req, res) => {
    try {
      const { public_id, title, teacher, subject, className, description, fileType, tags, resource_type } = req.body;

      if (!public_id) {
        return res.status(400).json({ error: "Missing public_id" });
      }

      const contextStr = `title=${title}|teacher=${teacher}|subject=${subject}|class=${className}|description=${description}|fileType=${fileType}|tags=${tags || ''}`;

      console.log(`Updating metadata for: ${public_id}`);
      await cloudinary.api.update(public_id, {
        resource_type: resource_type || 'image',
        context: contextStr
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating content:", error);
      res.status(500).json({ error: "Failed to update content", details: error.message });
    }
  });

  // Get signature for direct upload
  app.get("/api/sign-upload", (req, res) => {
    try {
      const { context } = req.query;
      const timestamp = Math.round((new Date).getTime() / 1000);
      const folder = "sunrise_classroom";
      
      const paramsToSign: any = {
        timestamp: timestamp,
        folder: folder,
      };

      if (context) {
        paramsToSign.context = context;
      }
      
      const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET || "YMIVl-hidOuXm0yYkzq7xX0raKg");

      res.json({ 
        signature, 
        timestamp, 
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "de4qwrmmw",
        apiKey: process.env.CLOUDINARY_API_KEY || "884247873451835",
        folder
      });
    } catch (error: any) {
      console.error("Error generating signature:", error);
      res.status(500).json({ error: "Failed to generate upload signature" });
    }
  });

  // Upload new content (Legacy, kept for fallback)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, teacher, subject, className, description, fileType, tags } = req.body;

      console.log(`Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "sunrise_classroom",
        resource_type: "auto",
        context: `title=${title}|teacher=${teacher}|subject=${subject}|class=${className}|description=${description}|fileType=${fileType}|tags=${tags || ''}`,
      });

      console.log("Upload successful:", result.public_id);
      res.json({ success: true, resource: result });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ 
        error: "Failed to upload file", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
