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
app.use(cors({
  // Allow requests from specified origins
  origin: function(origin, callback) {
    // For local development or testing from Replit
    if (!origin || origin.includes('replit.dev') || origin.includes('replit.app')) {
      callback(null, true);
      return;
    }
    
    // For GitHub Pages domains
    const allowedDomains = [
      'https://yousef1508.github.io',
      'http://yousef1508.github.io',
      'https://gjersjoengolfclub.com',
      'http://gjersjoengolfclub.com'
    ];
    
    if (allowedDomains.indexOf(origin) !== -1 || origin.includes('github.io')) {
      callback(null, true);
    } else {
      console.warn(`CORS policy: Origin ${origin} not allowed`);
      // Still allow the request but log the warning
      callback(null, true);
    }
  },
  // Important for authentication cookies
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
    "X-GitHub-Deployment" // Special header for GitHub Pages detection
  ],
  // Expose additional headers
  exposedHeaders: ["X-Total-Count", "Content-Length", "Date"],
  // Set max age for preflight requests (24 hours)
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
