import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCcw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

// Helper function to get base path - similar to the one in App.tsx
const getBasePath = (): string => {
  // First check if we have dynamic runtime config with BASE_PATH
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

// This function checks if we landed here from a deep link on GitHub Pages
// If so, it will handle the routing properly for SPA navigation
const checkGitHubPagesDeepLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isGitHubPages = window.location.hostname.includes('github.io') || 
                        window.location.hostname.includes('gjersjoengolfclub.com');
                        
  if (!isGitHubPages) return false;
  
  // If we're on GitHub Pages, check if we have a path that needs to be handled
  const pathname = window.location.pathname;
  const basePath = getBasePath();
  
  // Remove the base path from the pathname to get the SPA route
  // and strip any trailing slashes
  let relativePath = pathname;
  if (basePath && pathname.startsWith(basePath)) {
    relativePath = pathname.substr(basePath.length);
  }
  
  if (!relativePath || relativePath === '/') return false;
  
  // At this point, we have a deep link that needs to be handled
  console.log('GitHub Pages deep link detected:', {
    originalPath: pathname,
    basePath,
    relativePath
  });
  
  return true;
};

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const [isGitHubDeepLink, setIsGitHubDeepLink] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  
  // Check if we reached this page from a GitHub Pages deep link
  useEffect(() => {
    const isDeepLink = checkGitHubPagesDeepLink();
    setIsGitHubDeepLink(isDeepLink);
    
    // For GitHub Pages deployments, check API connectivity
    if (typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') || 
      window.location.hostname.includes('gjersjoengolfclub.com')
    )) {
      setIsCheckingApi(true);
      
      // Try to ping the API
      const apiBaseUrl = window.ENV?.API_BASE_URL || 'https://husky-mower.replit.app';
      fetch(`${apiBaseUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'X-GitHub-Deployment': 'true',
          'Origin': window.location.origin
        }
      })
      .then(response => {
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      })
      .catch(() => {
        setApiStatus('offline');
      })
      .finally(() => {
        setIsCheckingApi(false);
      });
    }
  }, []);

  const goHome = useCallback(() => {
    const basePath = getBasePath();
    window.location.href = `${basePath}/`;
  }, []);
  
  const checkApiConnection = useCallback(() => {
    setIsCheckingApi(true);
    setApiStatus('unknown');
    
    // Try to ping the API
    const apiBaseUrl = window.ENV?.API_BASE_URL || 'https://husky-mower.replit.app';
    fetch(`${apiBaseUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'X-GitHub-Deployment': 'true',
        'Origin': window.location.origin
      }
    })
    .then(response => {
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    })
    .catch(() => {
      setApiStatus('offline');
    })
    .finally(() => {
      setIsCheckingApi(false);
    });
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you are looking for does not exist or has been moved.
          </p>
          
          {isGitHubDeepLink && (
            <div className="mt-4 p-3 bg-orange-50 text-orange-800 rounded-md text-sm">
              <p className="font-medium">GitHub Pages SPA Navigation</p>
              <p className="mt-1">It looks like you're trying to access a deep link on GitHub Pages.</p>
              <p className="mt-1">Single Page Applications on GitHub Pages require special handling for direct URLs.</p>
            </div>
          )}
          
          {/* API Status for GitHub Pages */}
          {(window.location.hostname.includes('github.io') || 
            window.location.hostname.includes('gjersjoengolfclub.com')) && (
            <div className="mt-4 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <p className="font-medium text-sm">API Connection</p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {isCheckingApi ? (
                  <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse"></div>
                ) : apiStatus === 'online' ? (
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                ) : apiStatus === 'offline' ? (
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                ) : (
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                )}
                <p className="text-xs text-gray-600">
                  {isCheckingApi ? 'Checking connection...' 
                   : apiStatus === 'online' ? 'API is online' 
                   : apiStatus === 'offline' ? 'API connection failed' 
                   : 'API status unknown'}
                </p>
              </div>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkApiConnection} 
                  disabled={isCheckingApi}
                  className="text-xs h-8"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Check Connection
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <Button onClick={goHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
