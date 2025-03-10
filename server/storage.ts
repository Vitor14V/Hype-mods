import { 
  User, InsertUser, Mod, InsertMod, Announcement, InsertAnnouncement, 
  Comment, InsertComment, InsertCommentReport, ChatMessage,
  UpdateUserProfile, SupportTicket, InsertSupportTicket, UpdateSupportTicket
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from "fs";
import path from "path";

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
  updateMod(modId: number, mod: Partial<InsertMod>): Promise<Mod>;
  deleteMod(modId: number): Promise<void>;
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
  protected users: Map<number, User>;
  protected mods: Map<number, Mod>;
  protected announcements: Map<number, Announcement>;
  protected comments: Map<number, Comment>;
  protected chatMessages: Map<number, ChatMessage>;
  protected currentId: number;
  sessionStore: session.Store;

  protected supportTickets: Map<number, SupportTicket>;

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

  async updateMod(modId: number, mod: Partial<InsertMod>): Promise<Mod> {
    const existingMod = this.mods.get(modId);
    if (!existingMod) {
      throw new Error("Mod não encontrado");
    }

    const updatedMod: Mod = {
      ...existingMod,
      title: mod.title !== undefined ? mod.title : existingMod.title,
      description: mod.description !== undefined ? mod.description : existingMod.description,
      imageUrl: mod.imageUrl !== undefined ? mod.imageUrl : existingMod.imageUrl,
      downloadUrl: mod.downloadUrl !== undefined ? mod.downloadUrl : existingMod.downloadUrl,
      tags: mod.tags !== undefined ? mod.tags : existingMod.tags,
    };
    this.mods.set(modId, updatedMod);
    return updatedMod;
  }

  async deleteMod(modId: number): Promise<void> {
    if (!this.mods.has(modId)) {
      throw new Error("Mod não encontrado");
    }
    this.mods.delete(modId);
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

export class FileStorage extends MemStorage {
  private dataDir: string;
  
  constructor(dataDir: string = "./data") {
    super();
    this.dataDir = dataDir;
    
    // Criar diretório de dados se não existir
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Carregar dados salvos
    this.loadData();
  }
  
  // Métodos para salvar e carregar dados
  private saveData() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        mods: Array.from(this.mods.entries()),
        comments: Array.from(this.comments.entries()),
        announcements: Array.from(this.announcements.entries()),
        chatMessages: Array.from(this.chatMessages.entries()),
        supportTickets: Array.from(this.supportTickets.entries()),
        currentId: this.currentId
      };
      
      fs.writeFileSync(
        path.join(this.dataDir, "data.json"), 
        JSON.stringify(data, null, 2),
        'utf8'
      );
      console.log("Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }
  
  private loadData() {
    try {
      const dataPath = path.join(this.dataDir, "data.json");
      
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Restaurar dados
        this.users = new Map(data.users);
        this.mods = new Map(data.mods);
        this.comments = new Map(data.comments);
        this.announcements = new Map(data.announcements);
        this.chatMessages = new Map(data.chatMessages);
        this.supportTickets = new Map(data.supportTickets);
        this.currentId = data.currentId;
        
        console.log("Dados carregados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Se houver erro ao carregar, continua com os dados vazios
    }
  }
  
  // Sobrescrever os métodos de gravação para salvar após alterações
  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await super.createUser(insertUser);
    this.saveData();
    return user;
  }
  
  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    const user = await super.updateUserProfile(userId, profile);
    this.saveData();
    return user;
  }
  
  async reportUser(userId: number, reason: string): Promise<User> {
    const user = await super.reportUser(userId, reason);
    this.saveData();
    return user;
  }
  
  async approveUserProfile(userId: number): Promise<User> {
    const user = await super.approveUserProfile(userId);
    this.saveData();
    return user;
  }
  
  async banUser(userId: number): Promise<User> {
    const user = await super.banUser(userId);
    this.saveData();
    return user;
  }
  
  async unbanUser(userId: number): Promise<User> {
    const user = await super.unbanUser(userId);
    this.saveData();
    return user;
  }
  
  async createMod(mod: InsertMod): Promise<Mod> {
    const newMod = await super.createMod(mod);
    this.saveData();
    return newMod;
  }
  
  async updateMod(modId: number, mod: Partial<InsertMod>): Promise<Mod> {
    const updatedMod = await super.updateMod(modId, mod);
    this.saveData();
    return updatedMod;
  }
  
  async deleteMod(modId: number): Promise<void> {
    await super.deleteMod(modId);
    this.saveData();
  }
  
  async rateMod(modId: number, rating: number): Promise<Mod> {
    const mod = await super.rateMod(modId, rating);
    this.saveData();
    return mod;
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment = await super.createComment(comment);
    this.saveData();
    return newComment;
  }
  
  async reportComment(commentId: number, reason: string): Promise<Comment> {
    const comment = await super.reportComment(commentId, reason);
    this.saveData();
    return comment;
  }
  
  async resolveReportedComment(commentId: number): Promise<Comment> {
    const comment = await super.resolveReportedComment(commentId);
    this.saveData();
    return comment;
  }
  
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const newTicket = await super.createSupportTicket(ticket);
    this.saveData();
    return newTicket;
  }
  
  async updateSupportTicket(id: number, data: UpdateSupportTicket): Promise<SupportTicket> {
    const ticket = await super.updateSupportTicket(id, data);
    this.saveData();
    return ticket;
  }
  
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const newAnnouncement = await super.createAnnouncement(announcement);
    this.saveData();
    return newAnnouncement;
  }
  
  async deleteAnnouncement(id: number): Promise<void> {
    await super.deleteAnnouncement(id);
    this.saveData();
  }
  
  async createChatMessage(userId: number, message: string): Promise<ChatMessage> {
    const chatMessage = await super.createChatMessage(userId, message);
    this.saveData();
    return chatMessage;
  }
}

// Usar o armazenamento em arquivo para persistência dos dados
export const storage = new FileStorage();