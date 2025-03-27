import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// For development and debugging, log the origin of incoming requests
app.use((req, res, next) => {
  console.log(`Request from origin: ${req.headers.origin || 'unknown'} to ${req.path}`);
  next();
});

// Configure CORS with specific settings for GitHub Pages access
// IMPORTANT: We must use the exact origin in Access-Control-Allow-Origin for GitHub Pages
app.use(cors({
  // Allow requests from specified origins
  origin: function(origin, callback) {
    console.log(`CORS origin check for: ${origin || 'No Origin'}`);
    
    // For local development or testing from Replit
    // Also allow requests with no origin (like curl or Postman)
    if (!origin || 
        origin.includes('replit.dev') || 
        origin.includes('replit.app') || 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
      console.log(`CORS: Allowing request from development origin: ${origin}`);
      callback(null, true);
      return;
    }
    
    // For GitHub Pages domains - explicit list plus any github.io domain
    const allowedDomains = [
      'https://yousef1508.github.io',
      'http://yousef1508.github.io',
      'https://gjersjoengolfclub.com',
      'http://gjersjoengolfclub.com'
    ];
    
    // Always allow GitHub Pages domains with exact origin 
    // The key fix: return the specific origin, not just "true"
    if (origin && (origin.includes('github.io') || origin.includes('gjersjoengolfclub.com'))) {
      console.log(`CORS: Explicitly allowing GitHub Pages origin: ${origin}`);
      callback(null, origin); // Return the actual origin to set in Access-Control-Allow-Origin
    } 
    // For other domains, we'll still allow but log them for monitoring
    else {
      console.log(`CORS: Allowing origin: ${origin}`);
      callback(null, origin || true);
    }
  },
  // Important for authentication cookies - must be true for credentials: 'include' to work
  credentials: true,
  // Allow necessary methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Allow required headers
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "X-HTTP-Method-Override", 
    "Accept", 
    "Origin",
    "X-GitHub-Deployment", // Special header for GitHub Pages detection
    "Cache-Control",
    "X-Api-Key"
  ],
  // Expose headers needed by the frontend
  exposedHeaders: [
    "X-Total-Count", 
    "Content-Length", 
    "Date",
    "Access-Control-Allow-Origin", 
    "Access-Control-Allow-Credentials"
  ],
  // Set max age for preflight requests (6 hours)
  maxAge: 21600,
  // Return proper headers in OPTIONS preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Special handler for OPTIONS requests (CORS preflight)
// This ensures that CORS preflight requests are properly handled
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`Handling OPTIONS preflight request from: ${origin || 'unknown'}`);
  
  // Set additional headers for GitHub Pages deployment
  if (origin && (origin.includes('github.io') || origin.includes('gjersjoengolfclub.com'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-GitHub-Deployment, X-Api-Key');
    res.header('Vary', 'Origin');
    console.log('Added custom CORS headers for GitHub Pages preflight request');
  }
  
  // End OPTIONS requests here
  res.status(204).end();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Check if this is a request from GitHub Pages
    const origin = req.headers.origin;
    const isGitHubPagesRequest = origin && (
      origin.includes('github.io') || 
      origin.includes('yousef1508.github.io') ||
      origin.includes('gjersjoengolfclub.com')
    );
    
    console.error(`Error handling request from ${origin || 'unknown origin'}:`, {
      path: req.path,
      method: req.method,
      status,
      message,
      stack: err.stack,
    });
    
    // Provide more detailed error info for GitHub Pages deployment
    if (isGitHubPagesRequest) {
      res.status(status).json({
        message,
        origin: req.headers.origin,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        replit_endpoint: true,
        error_details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    } else {
      // Standard error response
      res.status(status).json({ message });
    }
    
    // In development, rethrow the error for better console logging
    if (process.env.NODE_ENV === 'development') {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
