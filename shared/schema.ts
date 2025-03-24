import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  firebaseUid: text("firebase_uid").unique(),
  role: text("role").default("user"),
});

export const usersRelations = relations(users, ({ many }) => ({
  mowers: many(mowers),
}));

// Mowers table
export const mowers = pgTable("mowers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  coverageArea: integer("coverage_area"),
  installationDate: timestamp("installation_date"),
  status: text("status").default("unknown"),
  batteryLevel: integer("battery_level"),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
  automowerId: text("automower_id"),
  type: text("type").default("automower"), // "automower" or "standard"
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  connectionStatus: text("connection_status").default("unknown"),
});

export const mowersRelations = relations(mowers, ({ one, many }) => ({
  user: one(users, {
    fields: [mowers.userId],
    references: [users.id],
  }),
  notes: many(notes),
  documents: many(documents),
  photos: many(photos),
}));

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  mowerId: integer("mower_id").references(() => mowers.id),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
});

export const notesRelations = relations(notes, ({ one }) => ({
  mower: one(mowers, {
    fields: [notes.mowerId],
    references: [mowers.id],
  }),
}));

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  mowerId: integer("mower_id").references(() => mowers.id),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  mower: one(mowers, {
    fields: [documents.mowerId],
    references: [mowers.id],
  }),
}));

// Photos table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  mowerId: integer("mower_id").references(() => mowers.id),
  caption: text("caption"),
  fileUrl: text("file_url").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const photosRelations = relations(photos, ({ one }) => ({
  mower: one(mowers, {
    fields: [photos.mowerId],
    references: [mowers.id],
  }),
}));

// Weather data table for caching
export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  forecast: jsonb("forecast").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMowerSchema = createInsertSchema(mowers).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
  batteryLevel: true,
  status: true,
  connectionStatus: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Mower = typeof mowers.$inferSelect;
export type InsertMower = z.infer<typeof insertMowerSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type WeatherData = typeof weatherData.$inferSelect;

// Auth-related schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Automower API response types
export type AutomowerStatus = {
  id: string;
  status: string;
  batteryLevel: number;
  lastActivity: string;
  modeOfOperation: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: string;
};

// Weather API response types
export type WeatherForecast = {
  date: string;
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
  mowingCondition: 'excellent' | 'good' | 'fair' | 'poor';
  icon: string;
};
