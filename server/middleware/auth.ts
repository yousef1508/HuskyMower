import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Authentication middleware
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // If already authenticated, continue
    if (req.session && req.session.userId) {
      return next();
    }
    
    // Check for firebase token in headers
    const firebaseToken = req.headers.authorization?.replace("Bearer ", "");
    
    if (!firebaseToken) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    // For Firebase token, we'll verify on the client side
    // Here we just need to match the firebase UID to a user
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized - No Firebase UID" });
    }
    
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }
    
    // Store user info in session
    req.session.userId = user.id;
    req.session.firebaseUid = user.firebaseUid!;
    req.session.email = user.email;
    req.session.name = user.name || "";
    req.session.role = user.role || "user";
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// Get current user middleware
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
