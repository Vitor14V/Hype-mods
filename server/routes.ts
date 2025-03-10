import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { 
  insertModSchema, 
  insertAnnouncementSchema, 
  insertCommentSchema, 
  insertCommentReportSchema,
  insertSupportTicketSchema,
  updateSupportTicketSchema,
  userReportSchema,
  updateUserProfileSchema,
  modProfileSchema
} from "@shared/schema";

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

// Array vazio sem mods de exemplo
const sampleMods: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Nenhum mod de exemplo será adicionado

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
  app.get("/api/mods", async (req, res) => {
    const query = req.query.q as string;
    const mods = query 
      ? await storage.searchMods(query)
      : await storage.getMods();
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

  // Rota para pesquisar mods
  app.get("/api/mods/search", async (req, res) => {
    const query = req.query.q as string || "";
    const mods = await storage.searchMods(query);
    res.json(mods);
  });

  // Rotas para gestão de usuários
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.put("/api/users/:userId/ban", async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
      const user = await storage.banUser(userId);
      
      // Notificar todos os clientes conectados sobre o banimento
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'user_banned', 
            data: { userId } 
          }));
        }
      });
      
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  app.put("/api/users/:userId/unban", async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
      const user = await storage.unbanUser(userId);
      
      // Notificar todos os clientes conectados sobre o desbanimento
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'user_unbanned', 
            data: { userId } 
          }));
        }
      });
      
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Rotas para denúncias de comentários
  app.post("/api/comments/:commentId/report", async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    const { reportReason } = req.body;
    
    if (!reportReason) {
      return res.status(400).json({ message: "É necessário fornecer um motivo para a denúncia" });
    }
    
    try {
      const comment = await storage.reportComment(commentId, reportReason);
      
      // Notificar admins sobre a nova denúncia
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'comment_reported', 
            data: comment 
          }));
        }
      });
      
      res.json(comment);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  app.get("/api/comments/reported", async (_req, res) => {
    const comments = await storage.getReportedComments();
    res.json(comments);
  });

  app.put("/api/comments/:commentId/resolve", async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    try {
      const comment = await storage.resolveReportedComment(commentId);
      res.json(comment);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Rotas para respostas a comentários
  app.get("/api/comments/:commentId/replies", async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    try {
      const replies = await storage.getRepliesByCommentId(commentId);
      res.json(replies);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Rotas para perfil de usuário
  app.put("/api/users/:userId/profile", upload.single('profilePicture'), async (req, res) => {
    const userId = parseInt(req.params.userId);
    let profilePicture = null;
    
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // Validar dados do perfil
    const parsed = updateUserProfileSchema.safeParse({
      ...req.body,
      profilePicture
    });
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    
    try {
      const user = await storage.updateUserProfile(userId, parsed.data);
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });
  
  // Denúncias de usuários
  app.post("/api/users/:userId/report", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    const parsed = userReportSchema.safeParse({
      id: userId,
      reportReason: req.body.reportReason
    });
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    
    try {
      // Garantir que reportReason seja uma string
      const reportReason = parsed.data.reportReason || "";
      const user = await storage.reportUser(userId, reportReason);
      
      // Notificar admins sobre novo usuário denunciado
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'user_reported', 
            data: { userId, reason: reportReason } 
          }));
        }
      });
      
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });
  
  app.get("/api/users/reported", async (_req, res) => {
    const users = await storage.getReportedUsers();
    res.json(users);
  });
  
  // Aprovação de perfil de usuário
  app.put("/api/users/:userId/approve", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
      const user = await storage.approveUserProfile(userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });
  
  // Sistema de suporte
  app.post("/api/support", async (req, res) => {
    const parsed = insertSupportTicketSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    
    try {
      const ticket = await storage.createSupportTicket(parsed.data);
      
      // Notificar admins sobre novo ticket de suporte
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'support_ticket_created', 
            data: ticket 
          }));
        }
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.get("/api/support", async (_req, res) => {
    const tickets = await storage.getSupportTickets();
    res.json(tickets);
  });
  
  app.get("/api/support/:ticketId", async (req, res) => {
    const ticketId = parseInt(req.params.ticketId);
    
    try {
      const ticket = await storage.getSupportTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket não encontrado" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });
  
  app.put("/api/support/:ticketId", async (req, res) => {
    const ticketId = parseInt(req.params.ticketId);
    
    const parsed = updateSupportTicketSchema.safeParse({
      ...req.body,
      id: ticketId
    });
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    
    try {
      const ticket = await storage.updateSupportTicket(ticketId, parsed.data);
      
      // Se o ticket foi resolvido, notificar o usuário
      if (parsed.data.status === "resolvido") {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'support_ticket_resolved', 
              data: ticket 
            }));
          }
        });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  return httpServer;
}