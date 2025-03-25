import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { automowerAPI } from "./automower";
import { weatherAPI } from "./weather";
import { authenticate, getCurrentUser } from "./middleware/auth";
import { sessionMiddleware, isAuthenticated, isAdmin } from "./middleware/session";
import { z } from "zod";
import { 
  insertMowerSchema, insertNoteSchema, insertDocumentSchema, 
  insertPhotoSchema, loginSchema, insertGeofenceSchema,
  insertZoneSchema, insertMowerZoneSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(sessionMiddleware);
  
  // Unauthenticated routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we would check password here
      // But we're using Firebase auth on the frontend
      
      // Set up session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name || "";
      req.session.role = user.role || "user";
      
      res.json({ 
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    try {
      const { uid, email: userEmail, displayName } = req.body;
      
      if (!uid || !userEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user exists
      let user = await storage.getUserByFirebaseUid(uid);
      
      if (!user) {
        // User doesn't exist, check if email exists
        user = await storage.getUserByEmail(userEmail);
        
        if (user) {
          // Update existing user with Firebase UID
          user = await storage.updateUser(user.id, { firebaseUid: uid });
        } else {
          // Create new user
          const username = userEmail.split('@')[0];
          user = await storage.createUser({
            username: username,
            email: userEmail,
            name: displayName || username,
            firebaseUid: uid,
            password: '' // Not used with Firebase auth
          });
        }
      }
      
      // Make sure user is defined
      if (!user) {
        return res.status(500).json({ message: "Failed to create or find user" });
      }
      
      // At this point, TypeScript knows user is not undefined
      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name || "",
        role: user.role || "user"
      };
      
      // Set up session
      req.session.userId = userInfo.id;
      req.session.firebaseUid = uid;
      req.session.email = userInfo.email;
      req.session.name = userInfo.name;
      req.session.role = userInfo.role;
      
      res.json({ 
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });
  
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Authenticate all other API routes
  app.use("/api", authenticate);
  
  // User routes
  app.get("/api/user", getCurrentUser, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    });
  });
  
  // Mower routes
  app.get("/api/mowers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const mowers = await storage.getMowers(userId);
      res.json(mowers);
    } catch (error) {
      console.error("Error getting mowers:", error);
      res.status(500).json({ message: "Failed to get mowers" });
    }
  });
  
  app.get("/api/mowers/type/:type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { type } = req.params;
      const mowers = await storage.getMowersByType(userId, type);
      res.json(mowers);
    } catch (error) {
      console.error(`Error getting mowers by type (${req.params.type}):`, error);
      res.status(500).json({ message: "Failed to get mowers by type" });
    }
  });
  
  app.get("/api/mowers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const mower = await storage.getMower(Number(id));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(mower);
    } catch (error) {
      console.error(`Error getting mower (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to get mower" });
    }
  });
  
  app.post("/api/mowers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertMowerSchema.parse(req.body);
      const userId = req.session.userId!;
      
      const mower = await storage.createMower({
        ...validatedData,
        userId
      });
      
      res.status(201).json(mower);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating mower:", error);
      res.status(500).json({ message: "Failed to create mower" });
    }
  });
  
  app.put("/api/mowers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const mower = await storage.getMower(Number(id));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedMower = await storage.updateMower(Number(id), req.body);
      res.json(updatedMower);
    } catch (error) {
      console.error(`Error updating mower (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to update mower" });
    }
  });
  
  app.delete("/api/mowers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const mower = await storage.getMower(Number(id));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteMower(Number(id));
      res.json({ message: "Mower deleted successfully" });
    } catch (error) {
      console.error(`Error deleting mower (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to delete mower" });
    }
  });
  
  // Automower API routes
  app.get("/api/automower/mowers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`User ${req.session.userId} (${req.session.email}) requesting Automower data`);
      const mowers = await automowerAPI.getMowers();
      console.log(`Found ${mowers.length} mowers from Automower API`);
      res.json(mowers);
    } catch (error) {
      console.error("Error getting Automower mowers:", error);
      res.status(500).json({ message: "Failed to get Automower mowers" });
    }
  });
  
  app.get("/api/automower/mowers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const mower = await automowerAPI.getMowerStatus(id);
      res.json(mower);
    } catch (error) {
      console.error(`Error getting Automower mower status (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to get Automower mower status" });
    }
  });
  
  app.post("/api/automower/mowers/:id/action", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      if (!action || !['START', 'STOP', 'PARK', 'PARK_UNTIL_NEXT_TASK', 'PARK_UNTIL_FURTHER_NOTICE', 'RESUME_SCHEDULE'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      await automowerAPI.controlMower(id, action);
      res.json({ message: "Action sent successfully" });
    } catch (error) {
      console.error(`Error controlling Automower mower (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to control Automower mower" });
    }
  });
  
  // Endpoint to register an automower in the database
  app.post("/api/automower/register", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { automowerId } = req.body;
      if (!automowerId) {
        return res.status(400).json({ message: "Missing automower ID" });
      }
      
      // Check if the automower exists in Husqvarna API
      const automowerStatus = await automowerAPI.getMowerStatus(automowerId);
      if (!automowerStatus) {
        return res.status(404).json({ message: "Automower not found in Husqvarna API" });
      }
      
      // Create the mower in our database
      const userId = req.session.userId!;
      
      // Check if mower already exists with this automowerId
      const existingMowers = await storage.getMowers(userId);
      const existingMower = existingMowers.find(m => m.automowerId === automowerId);
      
      if (existingMower) {
        return res.json(existingMower); // Return existing mower if already registered
      }
      
      // Format the data for our database
      const mowerData = {
        userId,
        name: `${automowerStatus.model || "Automower"} (${String(automowerStatus.serialNumber || "").slice(-6) || "Unknown"})`,
        model: automowerStatus.model || "Husqvarna Automower",
        serialNumber: automowerStatus.serialNumber ? String(automowerStatus.serialNumber) : `AM-${Date.now()}`,
        type: "automower",
        automowerId: automowerStatus.id,
        latitude: automowerStatus.latitude || null,
        longitude: automowerStatus.longitude || null,
        installationDate: new Date(),
        coverageArea: 0
      };
      
      const mower = await storage.createMower(mowerData);
      res.status(201).json(mower);
    } catch (error) {
      console.error("Error registering automower:", error);
      res.status(500).json({ message: "Failed to register automower" });
    }
  });
  
  // Notes routes
  app.get("/api/mowers/:mowerId/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const notes = await storage.getNotes(Number(mowerId));
      res.json(notes);
    } catch (error) {
      console.error(`Error getting notes for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to get notes" });
    }
  });
  
  app.post("/api/mowers/:mowerId/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      let mower;
      
      // First try to parse the ID as a number for our database ID
      const parsedId = parseInt(mowerId);
      if (!isNaN(parsedId)) {
        mower = await storage.getMower(parsedId);
      }
      
      // If not found, try by automowerId (UUID) or serialNumber
      if (!mower) {
        const userMowers = await storage.getMowers(req.session.userId!);
        mower = userMowers.find(m => 
          m.automowerId === mowerId || 
          m.serialNumber === mowerId
        );
      }
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertNoteSchema.parse(req.body);
      
      const note = await storage.createNote({
        ...validatedData,
        mowerId: mower.id, // Use the database ID here
        createdBy: req.session.name || req.session.email
      });
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error(`Error creating note for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  
  app.get("/api/notes/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const notes = await storage.getRecentNotes(limit);
      
      // Filter notes to only include those for mowers owned by the user
      const filteredNotes = notes.filter(note => note.mower.userId === req.session.userId);
      
      res.json(filteredNotes);
    } catch (error) {
      console.error("Error getting recent notes:", error);
      res.status(500).json({ message: "Failed to get recent notes" });
    }
  });
  
  // Documents routes
  app.get("/api/mowers/:mowerId/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocuments(Number(mowerId));
      res.json(documents);
    } catch (error) {
      console.error(`Error getting documents for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });
  
  app.post("/api/mowers/:mowerId/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertDocumentSchema.parse(req.body);
      
      const document = await storage.createDocument({
        ...validatedData,
        mowerId: Number(mowerId)
      });
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error(`Error creating document for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  // Photos routes
  app.get("/api/mowers/:mowerId/photos", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const photos = await storage.getPhotos(Number(mowerId));
      res.json(photos);
    } catch (error) {
      console.error(`Error getting photos for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to get photos" });
    }
  });
  
  app.post("/api/mowers/:mowerId/photos", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertPhotoSchema.parse(req.body);
      
      const photo = await storage.createPhoto({
        ...validatedData,
        mowerId: Number(mowerId)
      });
      
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error(`Error creating photo for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to create photo" });
    }
  });
  
  // Weather routes
  app.get("/api/weather", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Use the default coordinates or query parameters
      const latitude = Number(req.query.latitude) || 59.7907;
      const longitude = Number(req.query.longitude) || 10.7686;
      
      const forecast = await weatherAPI.getForecast(latitude, longitude);
      res.json(forecast);
    } catch (error) {
      console.error("Error getting weather forecast:", error);
      res.status(500).json({ message: "Failed to get weather forecast" });
    }
  });
  
  // Geofencing routes
  app.get("/api/geofences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const geofences = await storage.getGeofences(userId);
      res.json(geofences);
    } catch (error) {
      console.error("Error getting geofences:", error);
      res.status(500).json({ message: "Failed to get geofences" });
    }
  });
  
  app.get("/api/geofences/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const geofence = await storage.getGeofence(Number(id));
      
      if (!geofence) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      res.json(geofence);
    } catch (error) {
      console.error(`Error getting geofence (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to get geofence" });
    }
  });
  
  app.post("/api/geofences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertGeofenceSchema.parse(req.body);
      const userId = req.session.userId!;
      
      const geofence = await storage.createGeofence({
        ...validatedData,
        userId
      });
      
      res.status(201).json(geofence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence" });
    }
  });
  
  app.put("/api/geofences/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const geofence = await storage.getGeofence(Number(id));
      
      if (!geofence) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      const updatedGeofence = await storage.updateGeofence(Number(id), req.body);
      res.json(updatedGeofence);
    } catch (error) {
      console.error(`Error updating geofence (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to update geofence" });
    }
  });
  
  app.delete("/api/geofences/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const geofence = await storage.getGeofence(Number(id));
      
      if (!geofence) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      await storage.deleteGeofence(Number(id));
      res.json({ message: "Geofence deleted successfully" });
    } catch (error) {
      console.error(`Error deleting geofence (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to delete geofence" });
    }
  });
  
  // Zone routes
  app.get("/api/zones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const zones = await storage.getZones(userId);
      res.json(zones);
    } catch (error) {
      console.error("Error getting zones:", error);
      res.status(500).json({ message: "Failed to get zones" });
    }
  });
  
  app.get("/api/zones/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const zone = await storage.getZone(Number(id));
      
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      res.json(zone);
    } catch (error) {
      console.error(`Error getting zone (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to get zone" });
    }
  });
  
  app.post("/api/zones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertZoneSchema.parse(req.body);
      const userId = req.session.userId!;
      
      const zone = await storage.createZone({
        ...validatedData,
        userId
      });
      
      res.status(201).json(zone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating zone:", error);
      res.status(500).json({ message: "Failed to create zone" });
    }
  });
  
  app.put("/api/zones/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const zone = await storage.getZone(Number(id));
      
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      const updatedZone = await storage.updateZone(Number(id), req.body);
      res.json(updatedZone);
    } catch (error) {
      console.error(`Error updating zone (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to update zone" });
    }
  });
  
  app.delete("/api/zones/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const zone = await storage.getZone(Number(id));
      
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      await storage.deleteZone(Number(id));
      res.json({ message: "Zone deleted successfully" });
    } catch (error) {
      console.error(`Error deleting zone (${req.params.id}):`, error);
      res.status(500).json({ message: "Failed to delete zone" });
    }
  });
  
  // Mower Zone routes
  app.get("/api/mowers/:mowerId/zones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const mower = await storage.getMower(Number(mowerId));
      
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const mowerZones = await storage.getMowerZones(Number(mowerId));
      res.json(mowerZones);
    } catch (error) {
      console.error(`Error getting zones for mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to get mower zones" });
    }
  });
  
  app.post("/api/mowers/:mowerId/zones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId } = req.params;
      const { zoneId } = req.body;
      
      if (!zoneId) {
        return res.status(400).json({ message: "Zone ID is required" });
      }
      
      const mower = await storage.getMower(Number(mowerId));
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const zone = await storage.getZone(Number(zoneId));
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      const validatedData = insertMowerZoneSchema.parse({
        mowerId: Number(mowerId),
        zoneId: Number(zoneId),
        scheduledStartTime: req.body.scheduledStartTime,
        scheduledEndTime: req.body.scheduledEndTime,
        priority: req.body.priority || 0,
        daysOfWeek: req.body.daysOfWeek || null
      });
      
      const mowerZone = await storage.assignZoneToMower(validatedData);
      res.status(201).json(mowerZone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error(`Error assigning zone to mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to assign zone to mower" });
    }
  });
  
  app.delete("/api/mowers/:mowerId/zones/:zoneId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { mowerId, zoneId } = req.params;
      
      const mower = await storage.getMower(Number(mowerId));
      if (!mower) {
        return res.status(404).json({ message: "Mower not found" });
      }
      
      // Check if user has access to this mower
      if (mower.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.removeZoneFromMower(Number(mowerId), Number(zoneId));
      res.json({ message: "Zone removed from mower successfully" });
    } catch (error) {
      console.error(`Error removing zone (${req.params.zoneId}) from mower (${req.params.mowerId}):`, error);
      res.status(500).json({ message: "Failed to remove zone from mower" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
