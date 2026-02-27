import express from "express";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "de4qwrmmw",
  api_key: process.env.CLOUDINARY_API_KEY || "884247873451835",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YMIVl-hidOuXm0yYkzq7xX0raKg",
});

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Fetch all resources with metadata
  app.get("/api/content", async (req, res) => {
    try {
      // We use the search API to get resources with context (metadata)
      const result = await cloudinary.search
        .expression("folder:sunrise_classroom")
        .with_field("context")
        .sort_by("created_at", "desc")
        .max_results(100)
        .execute();

      res.json({ resources: result.resources });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Upload new content
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, teacher, subject, className, description, fileType } = req.body;

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "sunrise_classroom",
        resource_type: "auto",
        context: `title=${title}|teacher=${teacher}|subject=${subject}|class=${className}|description=${description}|fileType=${fileType}`,
      });

      res.json({ success: true, resource: result });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
