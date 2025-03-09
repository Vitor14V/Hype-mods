import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertModSchema, insertAnnouncementSchema, insertCommentSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Criar alguns mods de exemplo
const sampleMods = [
  {
    title: "Better Graphics Mod",
    description: "Melhora os gráficos do jogo com texturas em HD e efeitos visuais aprimorados.",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
    downloadUrl: "https://example.com/better-graphics-mod",
  },
  {
    title: "Extra Weapons Pack",
    description: "Adiciona 50 novas armas ao jogo, incluindo espadas lendárias e arcos mágicos.",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    downloadUrl: "https://example.com/extra-weapons",
  },
  {
    title: "New Character Skins",
    description: "Pack com 20 novas skins para personalizar seu personagem.",
    imageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1",
    downloadUrl: "https://example.com/character-skins",
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Adicionar mods de exemplo
  for (const mod of sampleMods) {
    await storage.createMod(mod);
  }

  // Ensure uploads directory exists
  try {
    await fs.mkdir('uploads', { recursive: true });
    console.log('Uploads directory created/verified successfully');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }

  // Add file upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Return the URL that can be used to access the file
    const url = `/uploads/${file.filename}`;
    res.json({ url });
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // API Routes
  app.get("/api/mods", async (_req, res) => {
    const mods = await storage.getMods();
    res.json(mods);
  });

  app.post("/api/mods", async (req, res) => {
    const parsed = insertModSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const mod = await storage.createMod(parsed.data);
    res.status(201).json(mod);
  });

  app.get("/api/mods/:modId/comments", async (req, res) => {
    const comments = await storage.getCommentsByModId(parseInt(req.params.modId));
    res.json(comments);
  });

  app.post("/api/mods/:modId/comments", async (req, res) => {
    const parsed = insertCommentSchema.safeParse({
      ...req.body,
      modId: parseInt(req.params.modId),
    });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const comment = await storage.createComment(parsed.data);
    res.status(201).json(comment);
  });

  app.post("/api/mods/:modId/rate", async (req, res) => {
    const modId = parseInt(req.params.modId);
    const rating = parseInt(req.body.rating);

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating" });
    }

    const mod = await storage.rateMod(modId, rating);
    res.json(mod);
  });

  app.get("/api/announcements", async (_req, res) => {
    const announcements = await storage.getAnnouncements();
    res.json(announcements);
  });

  app.post("/api/announcements", async (req, res) => {
    const parsed = insertAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const announcement = await storage.createAnnouncement(parsed.data);

    // Broadcast announcement to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'announcement', data: announcement }));
      }
    });

    res.status(201).json(announcement);
  });

  // Adicionar a rota de DELETE para anúncios
  app.delete("/api/announcements/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteAnnouncement(id);

    // Notificar todos os clientes conectados sobre a remoção
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'announcement_deleted', 
          data: { id } 
        }));
      }
    });

    res.sendStatus(200);
  });

  return httpServer;
}