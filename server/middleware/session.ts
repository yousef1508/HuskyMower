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
    // In production, secure should be true for HTTPS
    // For GitHub Pages to Replit HTTPS communication, this MUST be true
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    
    // Cross-Origin Resource Sharing (CORS) for GitHub Pages
    // 'none' allows cross-origin cookies which is absolutely required for GitHub Pages
    // This MUST be 'none' for cross-origin (GitHub Pages to Replit) to work with secure cookies
    sameSite: isProduction ? 'none' : 'lax',
    
    // Enables cookies to be set for specific domain
    // This is needed when the application is hosted on a different domain than the API
    // For GitHub Pages to Replit communication, we need to explicitly allow cross-domain cookies
    domain: undefined // This will default to the current domain
  },
  
  // Additional session middleware configuration
  proxy: true, // Trust the reverse proxy (important for HTTPS)
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
  
  // Check for special GitHub Pages debugging header
  const isGitHubDeployment = req.headers['x-github-deployment'] === 'true';
  
  // For GitHub Pages requests, ensure CORS headers are properly set
  if (isGitHubPagesRequest && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GitHub-Deployment, X-Deployment-Type, Origin');
    
    // Log more detailed information for GitHub Pages requests
    console.log(`GitHub Pages auth check - Session: ${!!req.session}, UserId: ${req.session?.userId}, Origin: ${origin}`);
    console.log(`Cookies: ${req.headers.cookie || 'none'}`);
  } else {
    // Log basic authentication attempt for non-GitHub Pages requests
    console.log(`Auth check - Session: ${!!req.session}, UserId: ${req.session?.userId}, Origin: ${origin || 'none'}`);
  }
  
  // First check the session for authentication
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Special case: GitHub Pages ping request for connectivity testing
  // Allow GitHub Pages app to ping the server without authentication
  if (isGitHubDeployment && req.path === '/api/ping') {
    return next();
  }

  // For GitHub Pages deployment, add special debugging info in the response
  if (isGitHubPagesRequest) {
    // Include headers in error response for debugging
    const debugInfo = {
      sessionStatus: !!req.session,
      sessionId: req.session?.id,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      isGitHubDeployment,
      path: req.path,
      method: req.method
    };
    
    return res.status(401).json({ 
      message: "Unauthorized - Cross-Origin Session Issue", 
      detail: "Your session may not be properly maintained across domains.",
      debug: debugInfo,
      timestamp: new Date().toISOString()
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
