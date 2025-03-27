import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Mowers from "./pages/mowers";
import MowerDetails from "./pages/mower-details";
import Weather from "./pages/weather";
import Maintenance from "./pages/maintenance";
import Geofencing from "./pages/geofencing";
import { AuthProvider, useAuth } from "./hooks/use-auth";

// Extend Window interface to include ENV
declare global {
  interface Window {
    ENV?: {
      BASE_PATH?: string;
      [key: string]: any;
    };
  }
}

// Helper function to get base path for GitHub Pages
const getBasePath = (): string => {
  // First check if we have dynamic runtime config with BASE_PATH
  // This is set by gh-pages-redirect.js for GitHub Pages
  if (typeof window !== 'undefined' && window.ENV && window.ENV.BASE_PATH) {
    return window.ENV.BASE_PATH;
  }
  
  // Otherwise check if we're in production mode with BASE_URL from Vite
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/' 
      ? import.meta.env.BASE_URL.endsWith('/') 
        ? import.meta.env.BASE_URL.slice(0, -1) 
        : import.meta.env.BASE_URL
      : '';
  }
  
  return '';
};

// Define a custom hook for handling base path routing
const useBasePathRouter = () => {
  const basePath = getBasePath();
  const [location, setLocation] = useLocation();
  
  // Listen for custom routeChange events from our gh-pages redirect script
  useEffect(() => {
    const handleRouteChange = (e: CustomEvent) => {
      if (e.detail && e.detail.path) {
        console.log('Custom routeChange event received with path:', e.detail.path);
        setLocation(e.detail.path);
      }
    };
    
    window.addEventListener('routeChange', handleRouteChange as EventListener);
    return () => {
      window.removeEventListener('routeChange', handleRouteChange as EventListener);
    };
  }, [setLocation]);
  
  // Handle paths with base path for GitHub Pages
  useEffect(() => {
    // Initialize ENV object if it doesn't exist
    if (typeof window !== 'undefined') {
      window.ENV = window.ENV || {};
    }
    
    // If location starts with base path, we need to normalize it
    if (basePath && location.startsWith(basePath)) {
      console.log('Normalizing path:', location, 'with basePath:', basePath);
      const normalizedPath = location.slice(basePath.length) || '/';
      
      // Avoid redirect loops - only update if the path is actually changing
      if (normalizedPath !== location) {
        console.log('Updating location from', location, 'to', normalizedPath);
        setLocation(normalizedPath);
      }
    }
  }, [location, basePath, setLocation]);
  
  // Handle redirect from sessionStorage (set by 404.html)
  useEffect(() => {
    const storedPath = sessionStorage.getItem('redirectPath');
    if (storedPath) {
      console.log('Found stored redirect path:', storedPath);
      sessionStorage.removeItem('redirectPath');
      sessionStorage.removeItem('redirectCount');
      
      // Navigate to the stored path
      if (storedPath !== location) {
        setLocation(storedPath);
      }
    }
  }, [location, setLocation]);
  
  return basePath;
};

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [x: string]: any }) {
  const { user, loading } = useAuth();
  const basePath = getBasePath();
  const [location, navigate] = useLocation();
  
  // Always define useEffect, regardless of conditions
  // This ensures hooks are called in the same order every render
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>;
  }
  
  // Early return null if not authenticated, the useEffect above will handle the redirect
  if (!user) {
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  // For GitHub Pages, we need to handle the base path
  // This hook will normalize paths by removing the base path prefix if present
  useBasePathRouter();
  
  // Log current authentication state on mount for debugging
  const { user, loading } = useAuth();
  useEffect(() => {
    console.log('Router mounted - Auth state:', { 
      user: user ? 'logged in' : 'not logged in', 
      loading,
      currentPath: window.location.pathname,
      currentLocation: window.location.href
    });
  }, [user, loading]);
  
  // Routes will now be matched correctly regardless of base path
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/mowers" component={() => <ProtectedRoute component={Mowers} />} />
      <Route path="/mowers/:id" component={(params) => <ProtectedRoute component={MowerDetails} {...params} />} />
      <Route path="/weather" component={() => <ProtectedRoute component={Weather} />} />
      <Route path="/maintenance" component={() => <ProtectedRoute component={Maintenance} />} />
      <Route path="/geofencing" component={() => <ProtectedRoute component={Geofencing} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
