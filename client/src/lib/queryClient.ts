import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to get environment variables that works both in development and production
const getEnv = (key: string, defaultValue = ''): string => {
  // For GitHub Pages deployment, we use window.ENV which is set in env-config.js
  if (typeof window !== 'undefined' && window.ENV) {
    // First try with the exact key
    // @ts-ignore - window.ENV is set at runtime in GitHub Pages
    if (window.ENV[key]) {
      console.log(`Found GitHub Pages env var for ${key}`);
      // @ts-ignore
      return window.ENV[key];
    }
    
    // Also try with alternative key format (with/without VITE_ prefix)
    const altKey = key.startsWith('VITE_') ? key.substring(5) : `VITE_${key}`;
    // @ts-ignore
    if (window.ENV[altKey]) {
      console.log(`Found GitHub Pages env var for ${key} as ${altKey}`);
      // @ts-ignore
      return window.ENV[altKey];
    }
  }
  
  // For development and regular builds, use import.meta.env
  // @ts-ignore
  if (import.meta && import.meta.env && import.meta.env[key]) {
    console.log(`Found Vite env var for ${key}`);
    // @ts-ignore
    return import.meta.env[key];
  }
  
  if (key.includes('API_BASE_URL') || key.includes('FIREBASE')) {
    console.log(`Environment variable ${key} not found, using default: "${defaultValue}"`);
  }
  
  return defaultValue;
};

// API base URL for backend requests - this is crucial for GitHub Pages to work
// The correct URL should be 'https://husky-mower.replit.app' not 'husky-mower-backend.replit.app'
const API_BASE_URL = getEnv('API_BASE_URL', '') || getEnv('VITE_API_BASE_URL', '');

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL || 'Using relative URLs (development mode)');

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      const errorMessage = text || res.statusText;
      
      // Log clearer error message for debugging
      console.error(`API Error (${res.status})`, {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
        message: errorMessage
      });
      
      if (res.status === 0 || res.status === 504) {
        throw new Error(`Network error: Could not connect to the server. The backend may be offline or there might be a CORS issue.`);
      } else if (res.status === 401) {
        throw new Error(`Authentication error: You are not logged in or your session has expired.`);
      } else if (res.status === 403) {
        throw new Error(`Authorization error: You don't have permission to perform this action.`);
      } else {
        throw new Error(`${res.status}: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

// Helper to ensure endpoint has proper base URL in production
function getFullEndpoint(endpoint: string): string {
  // If endpoint already starts with http:// or https://, return as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // If endpoint starts with /api/, prepend the base URL when in production
  if (endpoint.startsWith('/api/')) {
    // First try to get from explicit environment variable
    let apiBaseUrl = API_BASE_URL;
    
    // If not set, check if we're in GitHub Pages and use the hardcoded value
    if (!apiBaseUrl) {
      // Check if we're running on GitHub Pages or custom domain by looking at the hostname
      const isGitHubPages = typeof window !== 'undefined' && (
        window.location.hostname.includes('github.io') || 
        window.location.hostname.includes('gjersjoengolfclub.com') ||
        window.location.hostname.includes('yousef1508.github.io')
      );
      
      if (isGitHubPages) {
        apiBaseUrl = 'https://husky-mower.replit.app';
        console.log('Detected GitHub Pages or custom domain deployment, using Replit backend URL:', apiBaseUrl);
        // Allow window.ENV to override the hardcoded URL (for easier testing)
        if (window.ENV && window.ENV.API_BASE_URL) {
          apiBaseUrl = window.ENV.API_BASE_URL;
          console.log('Overriding Replit backend URL from window.ENV:', apiBaseUrl);
        }
      } else {
        // For local development, we'll use relative URLs
        console.log('Using relative URL for API request');
        return endpoint;
      }
    }
    
    // Remove any trailing slash from base URL
    const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    // Log the full URL for debugging
    const fullUrl = `${cleanBaseUrl}${endpoint}`;
    console.log(`API request to: ${fullUrl}`);
    return fullUrl;
  }
  
  return endpoint;
}

export async function apiRequest(
  endpoint: string,
  options?: RequestInit,
): Promise<any> {
  const fullEndpoint = getFullEndpoint(endpoint);
  
  try {
    // Add origin header for CORS requests on GitHub Pages
    const isGitHubPages = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') || 
      window.location.hostname.includes('gjersjoengolfclub.com') ||
      window.location.hostname.includes('yousef1508.github.io')
    );
       
    // Create headers object
    const headersObj: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    // Only add special headers when on GitHub Pages or custom domain
    if (isGitHubPages) {
      headersObj["Origin"] = window.location.origin;
      headersObj["X-Requested-With"] = "XMLHttpRequest";
      headersObj["X-GitHub-Deployment"] = "true";
      headersObj["X-Deployment-Type"] = "github-pages";
    }
    
    // Add any headers from options
    if (options?.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.keys(optHeaders).forEach(key => {
        headersObj[key] = optHeaders[key];
      });
    }
    
    // Create a new options object without the headers
    const newOptions = { ...options };
    if (newOptions.headers) {
      delete newOptions.headers;
    }
    
    const res = await fetch(fullEndpoint, {
      credentials: "include",
      headers: headersObj,
      ...newOptions,
    });

    await throwIfResNotOk(res);
    
    // Only try to parse as JSON if there's content
    if (res.status !== 204) { // No Content
      return await res.json();
    }
    
    return null;
  } catch (error) {
    console.error(`API request failed to ${fullEndpoint}:`, error);
    
    // Provide more helpful error for CORS issues
    if (error instanceof Error && 
        (error.message.includes('CORS') || 
         error.message.includes('network') || 
         error.message.includes('Failed to fetch'))) {
      
      console.error(`Possible CORS issue detected with endpoint: ${fullEndpoint}`);
      
      if (fullEndpoint.includes('husky-mower.replit.app')) {
        console.error(`
          CORS troubleshooting guide:
          1. Ensure the Replit backend is running
          2. Check that CORS is configured on the backend to allow requests from ${window.location.origin}
          3. Verify that credentials: 'include' is properly handled on the server
        `);
      }
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const fullEndpoint = getFullEndpoint(endpoint);
    
    try {
      // Add origin header for CORS requests on GitHub Pages
      const isGitHubPages = typeof window !== 'undefined' && (
        window.location.hostname.includes('github.io') || 
        window.location.hostname.includes('gjersjoengolfclub.com') ||
        window.location.hostname.includes('yousef1508.github.io')
      );
         
      const headersObj: Record<string, string> = {};
      
      // Only add these headers when on GitHub Pages or custom domain
      if (isGitHubPages) {
        headersObj["Origin"] = window.location.origin;
        headersObj["X-Requested-With"] = "XMLHttpRequest";
        headersObj["X-GitHub-Deployment"] = "true";
        headersObj["X-Deployment-Type"] = "github-pages";
      }
      
      const res = await fetch(fullEndpoint, {
        credentials: "include",
        headers: headersObj
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      // Only try to parse as JSON if there's content
      if (res.status !== 204) { // No Content
        return await res.json();
      }
      
      return null;
    } catch (error) {
      console.error(`Query failed for ${fullEndpoint}:`, error);
      
      // Special handling for known errors
      if (error instanceof Error) {
        // If it's an auth error and we're configured to return null
        if (error.message.includes('401') && unauthorizedBehavior === "returnNull") {
          return null;
        }
        
        // Helpful error info for CORS issues
        if (error.message.includes('CORS') || 
            error.message.includes('network') || 
            error.message.includes('Failed to fetch')) {
          console.error(`Possible CORS issue detected with endpoint: ${fullEndpoint}`);
        }
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
