import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { NextFunction, Request, Response } from "express";

const PgSession = connectPgSimple(session);

// Detect if this is a production environment
const isProduction = process.env.NODE_ENV === "production";

// Session configuration with enhanced GitHub Pages support
export const sessionMiddleware = session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    },
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "husqvarna-automower-secret",
  resave: false,
  // Don't save uninitialized sessions to avoid unnecessary database writes
  saveUninitialized: false, 
  name: "husky_mower_session", // Custom cookie name for easy identification
  cookie: {
    // In production, secure should be true, but we need to conditionally set it
    // When the app serves HTTPS content, this should be true
    // But for local development over HTTP, it must be false
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    
    // Cross-Origin Resource Sharing (CORS) for GitHub Pages
    // 'none' allows cross-origin cookies which is needed for GitHub Pages
    // Must be 'none' for cross-origin (GitHub Pages to Replit) to work
    sameSite: isProduction ? 'none' : 'lax',
    
    // Enables cookies to be set for specific domain
    // This is needed when the application is hosted on a different domain than the API
    // For GitHub Pages to Replit communication, we need to explicitly allow cross-domain cookies
    domain: undefined // This will default to the current domain
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
  // Check for Origin header which might indicate a cross-origin request from GitHub Pages
  const origin = req.headers.origin;
  const isGitHubPagesRequest = origin && (
    origin.includes('github.io') || 
    origin.includes('yousef1508.github.io') ||
    origin.includes('gjersjoengolfclub.com')
  );
  
  // Log authentication attempt for debugging
  console.log(`Auth check - Session: ${!!req.session}, UserId: ${req.session?.userId}, Origin: ${origin || 'none'}`);
  
  // First check the session for authentication
  if (req.session && req.session.userId) {
    return next();
  }

  // For GitHub Pages deployment, add special debugging info in the response
  if (isGitHubPagesRequest) {
    // Include headers in error response for debugging
    const debugInfo = {
      sessionStatus: !!req.session,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host
    };
    
    return res.status(401).json({ 
      message: "Unauthorized - Cross-Origin Session Issue", 
      detail: "Your session may not be properly maintained across domains.",
      debug: debugInfo
    });
  }
  
  // Standard unauthorized response
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId && req.session.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}
