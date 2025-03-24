import {
  users, mowers, notes, documents, photos, weatherData,
  type User, type InsertUser, type Mower, type InsertMower,
  type Note, type InsertNote, type Document, type InsertDocument,
  type Photo, type InsertPhoto, type WeatherData, type WeatherForecast
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mower operations
  getMowers(userId: number): Promise<Mower[]>;
  getMower(id: number): Promise<Mower | undefined>;
  getMowersByType(userId: number, type: string): Promise<Mower[]>;
  createMower(mower: InsertMower): Promise<Mower>;
  updateMower(id: number, data: Partial<Mower>): Promise<Mower | undefined>;
  deleteMower(id: number): Promise<boolean>;
  
  // Notes operations
  getNotes(mowerId: number): Promise<Note[]>;
  getRecentNotes(limit: number): Promise<(Note & { mower: Mower })[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  // Documents operations
  getDocuments(mowerId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Photos operations
  getPhotos(mowerId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  
  // Weather operations
  getWeatherData(latitude: number, longitude: number): Promise<WeatherData | undefined>;
  saveWeatherData(latitude: number, longitude: number, forecast: WeatherForecast[]): Promise<WeatherData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Mower operations
  async getMowers(userId: number): Promise<Mower[]> {
    return db.select().from(mowers).where(eq(mowers.userId, userId));
  }
  
  async getMower(id: number): Promise<Mower | undefined> {
    const [mower] = await db.select().from(mowers).where(eq(mowers.id, id));
    return mower;
  }

  async getMowersByType(userId: number, type: string): Promise<Mower[]> {
    return db.select().from(mowers)
      .where(and(eq(mowers.userId, userId), eq(mowers.type, type)));
  }
  
  async createMower(mower: InsertMower): Promise<Mower> {
    const [newMower] = await db.insert(mowers).values(mower).returning();
    return newMower;
  }
  
  async updateMower(id: number, data: Partial<Mower>): Promise<Mower | undefined> {
    const [updatedMower] = await db.update(mowers)
      .set(data)
      .where(eq(mowers.id, id))
      .returning();
    return updatedMower;
  }
  
  async deleteMower(id: number): Promise<boolean> {
    const result = await db.delete(mowers).where(eq(mowers.id, id));
    return true;
  }
  
  // Notes operations
  async getNotes(mowerId: number): Promise<Note[]> {
    return db.select().from(notes)
      .where(eq(notes.mowerId, mowerId))
      .orderBy(desc(notes.createdAt));
  }
  
  async getRecentNotes(limit: number): Promise<(Note & { mower: Mower })[]> {
    const result = await db.query.notes.findMany({
      limit,
      orderBy: desc(notes.createdAt),
      with: {
        mower: true
      }
    });
    return result;
  }
  
  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }
  
  // Documents operations
  async getDocuments(mowerId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.mowerId, mowerId));
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }
  
  // Photos operations
  async getPhotos(mowerId: number): Promise<Photo[]> {
    return db.select().from(photos).where(eq(photos.mowerId, mowerId));
  }
  
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }
  
  // Weather operations
  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData | undefined> {
    // Find weather data not older than 3 hours
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
    
    const [data] = await db.select().from(weatherData)
      .where(
        and(
          eq(weatherData.latitude, latitude),
          eq(weatherData.longitude, longitude),
          gte(weatherData.timestamp, threeHoursAgo)
        )
      )
      .orderBy(desc(weatherData.timestamp))
      .limit(1);
      
    return data;
  }
  
  async saveWeatherData(latitude: number, longitude: number, forecast: WeatherForecast[]): Promise<WeatherData> {
    const [data] = await db.insert(weatherData)
      .values({
        latitude,
        longitude,
        forecast
      })
      .returning();
      
    return data;
  }
}

export const storage = new DatabaseStorage();
