import { User, InsertUser, Mod, InsertMod, Announcement, InsertAnnouncement, ChatMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMods(): Promise<Mod[]>;
  createMod(mod: InsertMod): Promise<Mod>;
  
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(userId: number, message: string): Promise<ChatMessage>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mods: Map<number, Mod>;
  private announcements: Map<number, Announcement>;
  private chatMessages: Map<number, ChatMessage>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.mods = new Map();
    this.announcements = new Map();
    this.chatMessages = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getMods(): Promise<Mod[]> {
    return Array.from(this.mods.values());
  }

  async createMod(mod: InsertMod): Promise<Mod> {
    const id = this.currentId++;
    const newMod: Mod = { ...mod, id, createdAt: new Date() };
    this.mods.set(id, newMod);
    return newMod;
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
