import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
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
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  modId: integer("mod_id").references(() => mods.id).notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
});

export const insertModSchema = createInsertSchema(mods).pick({
  title: true,
  description: true,
  imageUrl: true,
  downloadUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  modId: true,
  name: true,
  content: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  message: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
});


export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Mod = typeof mods.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertMod = z.infer<typeof insertModSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;