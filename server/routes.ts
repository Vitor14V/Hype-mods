import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertModSchema, insertAnnouncementSchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  app.get("/api/mods", async (_req, res) => {
    const mods = await storage.getMods();
    res.json(mods);
  });

  app.post("/api/mods", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Admin access required");
    }

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
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Admin access required");
    }

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

  app.get("/api/chat", async (_req, res) => {
    const messages = await storage.getChatMessages();
    res.json(messages);
  });

  // Keep track of authenticated WebSocket connections
  const clients = new Map<WebSocket, { userId: number }>();

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | undefined;

    ws.on('message', async (message: Buffer) => {
      if (!userId) return;

      try {
        const data = JSON.parse(message.toString());
        const parsed = insertChatMessageSchema.safeParse(data);
        if (!parsed.success) return;

        const chatMessage = await storage.createChatMessage(userId, parsed.data.message);

        // Broadcast chat message to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', data: chatMessage }));
          }
        });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Associate the WebSocket connection with the authenticated user
    app.once('login', (user) => {
      userId = user.id;
      clients.set(ws, { userId });
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return httpServer;
}