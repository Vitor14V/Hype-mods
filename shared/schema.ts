import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  isProfileApproved: boolean("is_profile_approved").default(false),
  isReported: boolean("is_reported").default(false),
  reportReason: text("report_reason"),
});

export const mods = pgTable("mods", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  downloadUrl: text("download_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rating: integer("rating").default(0).notNull(),
  numRatings: integer("num_ratings").default(0).notNull(),
  // Campo para facilitar pesquisas
  tags: text("tags").array().default([]).notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  modId: integer("mod_id").references(() => mods.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isReported: boolean("is_reported").default(false).notNull(),
  reportReason: text("report_reason"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  replyToId: integer("reply_to_id"),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("pendente").notNull(),
  responseMessage: text("response_message"),
  resolvedAt: timestamp("resolved_at"),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  bio: true,
  profilePicture: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  bio: true,
  profilePicture: true,
});

export const userReportSchema = createInsertSchema(users).pick({
  id: true,
  reportReason: true,
});

export const modProfileSchema = createInsertSchema(users).pick({
  id: true,
  isProfileApproved: true,
});

export const insertModSchema = createInsertSchema(mods).pick({
  title: true,
  description: true,
  imageUrl: true,
  downloadUrl: true,
  tags: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  modId: true,
  userId: true,
  name: true,
  content: true,
  replyToId: true,
});

export const insertCommentReportSchema = createInsertSchema(comments).pick({
  id: true,
  reportReason: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  subject: true,
  message: true,
});

export const updateSupportTicketSchema = createInsertSchema(supportTickets).pick({
  id: true,
  status: true,
  responseMessage: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  message: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
});


export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UserReport = z.infer<typeof userReportSchema>;
export type ModProfile = z.infer<typeof modProfileSchema>;
export type User = typeof users.$inferSelect;
export type Mod = typeof mods.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertMod = z.infer<typeof insertModSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertCommentReport = z.infer<typeof insertCommentReportSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type UpdateSupportTicket = z.infer<typeof updateSupportTicketSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;