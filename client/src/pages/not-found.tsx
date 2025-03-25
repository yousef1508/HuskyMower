import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

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

export default function NotFound() {
  const goHome = useCallback(() => {
    const basePath = getBasePath();
    window.location.href = `${basePath}/`;
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
