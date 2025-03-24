import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { NextFunction, Request, Response } from "express";

const PgSession = connectPgSimple(session);

// Session configuration
export const sessionMiddleware = session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    },
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "husqvarna-automower-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
});

// Type definition for session with user
declare module "express-session" {
  interface SessionData {
    userId: number;
    firebaseUid: string;
    email: string;
    name: string;
    role: string;
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId && req.session.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}
