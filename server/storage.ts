import { User, InsertUser, Mod, InsertMod, Announcement, InsertAnnouncement, Comment, InsertComment, InsertCommentReport, ChatMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  banUser(userId: number): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getMods(): Promise<Mod[]>;
  getModById(id: number): Promise<Mod | undefined>;
  createMod(mod: InsertMod): Promise<Mod>;
  rateMod(modId: number, rating: number): Promise<Mod>;
  searchMods(query: string): Promise<Mod[]>;

  getCommentsByModId(modId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  reportComment(commentId: number, reason: string): Promise<Comment>;
  getReportedComments(): Promise<Comment[]>;
  resolveReportedComment(commentId: number): Promise<Comment>;

  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(userId: number, message: string): Promise<ChatMessage>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mods: Map<number, Mod>;
  private announcements: Map<number, Announcement>;
  private comments: Map<number, Comment>;
  private chatMessages: Map<number, ChatMessage>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.mods = new Map();
    this.announcements = new Map();
    this.comments = new Map();
    this.chatMessages = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Criar admin inicial
    const adminUser: User = {
      id: this.currentId++,
      username: "admin",
      password: "admin123",
      isAdmin: true,
      isBanned: false
    };
    this.users.set(adminUser.id, adminUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      isBanned: false 
    };
    this.users.set(id, user);
    return user;
  }

  async banUser(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const updatedUser: User = {
      ...user,
      isBanned: true
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async unbanUser(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const updatedUser: User = {
      ...user,
      isBanned: false
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getMods(): Promise<Mod[]> {
    return Array.from(this.mods.values());
  }

  async getModById(id: number): Promise<Mod | undefined> {
    return this.mods.get(id);
  }

  async createMod(mod: InsertMod): Promise<Mod> {
    const id = this.currentId++;
    const newMod: Mod = { 
      ...mod, 
      id, 
      createdAt: new Date(),
      rating: 0,
      numRatings: 0,
      tags: Array.isArray(mod.tags) ? mod.tags : []
    };
    this.mods.set(id, newMod);
    return newMod;
  }

  async rateMod(modId: number, rating: number): Promise<Mod> {
    const mod = this.mods.get(modId);
    if (!mod) {
      throw new Error("Mod não encontrado");
    }

    const updatedMod: Mod = {
      ...mod,
      rating: mod.rating + rating,
      numRatings: mod.numRatings + 1
    };
    this.mods.set(modId, updatedMod);
    return updatedMod;
  }

  async searchMods(query: string): Promise<Mod[]> {
    if (!query) {
      return this.getMods();
    }
    
    query = query.toLowerCase();
    return Array.from(this.mods.values()).filter(
      (mod) => 
        mod.title.toLowerCase().includes(query) || 
        mod.description.toLowerCase().includes(query) ||
        (mod.tags && mod.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  async getCommentsByModId(modId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.modId === modId
    );
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentId++;
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date(),
      isReported: false,
      reportReason: null,
      userId: comment.userId || null
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async reportComment(commentId: number, reason: string): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error("Comentário não encontrado");
    }
    
    const updatedComment: Comment = {
      ...comment,
      isReported: true,
      reportReason: reason
    };
    this.comments.set(commentId, updatedComment);
    return updatedComment;
  }

  async getReportedComments(): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.isReported
    );
  }

  async resolveReportedComment(commentId: number): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error("Comentário não encontrado");
    }
    
    const updatedComment: Comment = {
      ...comment,
      isReported: false,
      reportReason: null
    };
    this.comments.set(commentId, updatedComment);
    return updatedComment;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentId++;
    const newAnnouncement: Announcement = { ...announcement, id, createdAt: new Date() };
    this.announcements.set(id, newAnnouncement);
    return newAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    this.announcements.delete(id);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  async createChatMessage(userId: number, message: string): Promise<ChatMessage> {
    const id = this.currentId++;
    const chatMessage: ChatMessage = { id, userId, message, createdAt: new Date() };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
}

export const storage = new MemStorage();