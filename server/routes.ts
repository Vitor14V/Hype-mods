import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertModSchema, insertAnnouncementSchema } from "@shared/schema";

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

  return httpServer;
}