import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to get environment variables that works both in development and production
const getEnv = (key: string, defaultValue = ''): string => {
  // For GitHub Pages deployment, we use window.ENV which is set in env-config.js
  // This is loaded at runtime rather than build time
  // @ts-ignore - window.ENV is set at runtime in GitHub Pages
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    // @ts-ignore
    return window.ENV[key];
  }
  
  // For development and regular builds, use import.meta.env
  // @ts-ignore
  if (import.meta && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  
  return defaultValue;
};

// API base URL - will be used in GitHub Pages deployment
// Local development will use relative URLs
const API_BASE_URL = getEnv('VITE_API_BASE_URL', '');

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to ensure endpoint has proper base URL in production
function getFullEndpoint(endpoint: string): string {
  // If endpoint already starts with http:// or https://, return as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // If endpoint starts with /api/, prepend the base URL when in production
  if (endpoint.startsWith('/api/') && API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }
  
  return endpoint;
}

export async function apiRequest(
  endpoint: string,
  options?: RequestInit,
): Promise<any> {
  const fullEndpoint = getFullEndpoint(endpoint);
  
  const res = await fetch(fullEndpoint, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  await throwIfResNotOk(res);
  
  // Only try to parse as JSON if there's content
  if (res.status !== 204) { // No Content
    return await res.json();
  }
  
  return null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const fullEndpoint = getFullEndpoint(endpoint);
    
    const res = await fetch(fullEndpoint, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
