import { 
  User, InsertUser, Mod, InsertMod, Announcement, InsertAnnouncement, 
  Comment, InsertComment, InsertCommentReport, ChatMessage,
  UpdateUserProfile, SupportTicket, InsertSupportTicket, UpdateSupportTicket
} from "@shared/schema";
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
  updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User>;
  reportUser(userId: number, reason: string): Promise<User>;
  getReportedUsers(): Promise<User[]>;
  approveUserProfile(userId: number): Promise<User>;

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
  getRepliesByCommentId(commentId: number): Promise<Comment[]>;

  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket>;

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

  private supportTickets: Map<number, SupportTicket>;

  constructor() {
    this.users = new Map();
    this.mods = new Map();
    this.announcements = new Map();
    this.comments = new Map();
    this.chatMessages = new Map();
    this.supportTickets = new Map();
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
      isBanned: false,
      profilePicture: null,
      bio: null,
      isProfileApproved: true,
      isReported: false,
      reportReason: null
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
      isBanned: false,
      profilePicture: insertUser.profilePicture || null,
      bio: insertUser.bio || null,
      isProfileApproved: false,
      isReported: false,
      reportReason: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const updatedUser: User = {
      ...user,
      profilePicture: profile.profilePicture || user.profilePicture,
      bio: profile.bio || user.bio,
      isProfileApproved: false // Requer aprovação ao atualizar
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async reportUser(userId: number, reason: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const updatedUser: User = {
      ...user,
      isReported: true,
      reportReason: reason
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getReportedUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.isReported
    );
  }
  
  async approveUserProfile(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const updatedUser: User = {
      ...user,
      isProfileApproved: true
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
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
      isResolved: false,
      userId: comment.userId || null,
      replyToId: comment.replyToId || null
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
      reportReason: reason,
      isResolved: false
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
      isResolved: true
    };
    this.comments.set(commentId, updatedComment);
    return updatedComment;
  }
  
  async getRepliesByCommentId(commentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.replyToId === commentId
    );
  }
  
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.currentId++;
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      createdAt: new Date(),
      status: "pendente",
      responseMessage: null,
      resolvedAt: null
    };
    this.supportTickets.set(id, newTicket);
    return newTicket;
  }
  
  async getSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }
  
  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }
  
  async updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) {
      throw new Error("Ticket de suporte não encontrado");
    }
    
    const updatedTicket: SupportTicket = {
      ...ticket,
      status: data.status || ticket.status,
      responseMessage: data.responseMessage || ticket.responseMessage,
      resolvedAt: data.status === "resolvido" ? new Date() : ticket.resolvedAt
    };
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
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