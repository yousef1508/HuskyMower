import {
  users, mowers, notes, documents, photos, weatherData, geofences, zones, mowerZones,
  type User, type InsertUser, type Mower, type InsertMower,
  type Note, type InsertNote, type Document, type InsertDocument,
  type Photo, type InsertPhoto, type WeatherData, type WeatherForecast,
  type Geofence, type InsertGeofence, type Zone, type InsertZone,
  type MowerZone, type InsertMowerZone, type GeoPosition, type GeoPolygon
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, gte, lte } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
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
  
  // Geofencing operations
  getGeofences(userId: number): Promise<Geofence[]>;
  getGeofence(id: number): Promise<Geofence | undefined>;
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  updateGeofence(id: number, data: Partial<Geofence>): Promise<Geofence | undefined>;
  deleteGeofence(id: number): Promise<boolean>;
  
  // Zone operations
  getZones(userId: number): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: number, data: Partial<Zone>): Promise<Zone | undefined>;
  deleteZone(id: number): Promise<boolean>;
  
  // Mower Zone operations
  getMowerZones(mowerId: number): Promise<(MowerZone & { zone: Zone })[]>;
  assignZoneToMower(mowerZone: InsertMowerZone): Promise<MowerZone>;
  removeZoneFromMower(mowerId: number, zoneId: number): Promise<boolean>;
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
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
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
    // First try to get the mower to check if it exists and get its serial number
    const mower = await this.getMower(mowerId);
    
    if (mower) {
      // Use either mowerId or serialNumber to find notes
      return db.select().from(notes)
        .where(
          or(
            eq(notes.mowerId, mowerId),
            eq(notes.mowerSerialNumber, mower.serialNumber)
          )
        )
        .orderBy(desc(notes.createdAt));
    } else {
      // If no mower found with this ID, just use the ID directly
      // This handles cases where mower might be using automowerId (string) but stored as number
      return db.select().from(notes)
        .where(eq(notes.mowerId, mowerId))
        .orderBy(desc(notes.createdAt));
    }
  }
  
  async getRecentNotes(limit: number): Promise<(Note & { mower: Mower })[]> {
    const result = await db.query.notes.findMany({
      limit,
      orderBy: desc(notes.createdAt),
      with: {
        mower: true
      }
    });
    
    // Filter out notes with null mower before returning
    return result.filter(note => note.mower !== null) as (Note & { mower: Mower })[];
  }
  
  async createNote(note: InsertNote): Promise<Note> {
    // If we have a mowerId, try to get the mower's serial number and add it to the note
    if (note.mowerId) {
      const mower = await this.getMower(note.mowerId);
      if (mower && mower.serialNumber) {
        note.mowerSerialNumber = mower.serialNumber;
      }
    }
    
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
  
  // Geofencing operations
  async getGeofences(userId: number): Promise<Geofence[]> {
    return db.select().from(geofences).where(eq(geofences.userId, userId));
  }
  
  async getGeofence(id: number): Promise<Geofence | undefined> {
    const [geofence] = await db.select().from(geofences).where(eq(geofences.id, id));
    return geofence;
  }
  
  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const [newGeofence] = await db.insert(geofences).values(geofence).returning();
    return newGeofence;
  }
  
  async updateGeofence(id: number, data: Partial<Geofence>): Promise<Geofence | undefined> {
    const [updatedGeofence] = await db.update(geofences)
      .set(data)
      .where(eq(geofences.id, id))
      .returning();
    return updatedGeofence;
  }
  
  async deleteGeofence(id: number): Promise<boolean> {
    await db.delete(geofences).where(eq(geofences.id, id));
    return true;
  }
  
  // Zone operations
  async getZones(userId: number): Promise<Zone[]> {
    return db.select().from(zones).where(eq(zones.userId, userId));
  }
  
  async getZone(id: number): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone;
  }
  
  async createZone(zone: InsertZone): Promise<Zone> {
    const [newZone] = await db.insert(zones).values(zone).returning();
    return newZone;
  }
  
  async updateZone(id: number, data: Partial<Zone>): Promise<Zone | undefined> {
    const [updatedZone] = await db.update(zones)
      .set(data)
      .where(eq(zones.id, id))
      .returning();
    return updatedZone;
  }
  
  async deleteZone(id: number): Promise<boolean> {
    await db.delete(zones).where(eq(zones.id, id));
    return true;
  }
  
  // Mower Zone operations
  async getMowerZones(mowerId: number): Promise<(MowerZone & { zone: Zone })[]> {
    const result = await db.query.mowerZones.findMany({
      where: eq(mowerZones.mowerId, mowerId),
      with: {
        zone: true
      }
    });
    
    return result as (MowerZone & { zone: Zone })[];
  }
  
  async assignZoneToMower(mowerZone: InsertMowerZone): Promise<MowerZone> {
    const [newMowerZone] = await db.insert(mowerZones).values(mowerZone).returning();
    return newMowerZone;
  }
  
  async removeZoneFromMower(mowerId: number, zoneId: number): Promise<boolean> {
    await db.delete(mowerZones)
      .where(
        and(
          eq(mowerZones.mowerId, mowerId),
          eq(mowerZones.zoneId, zoneId)
        )
      );
    return true;
  }
}

export const storage = new DatabaseStorage();
