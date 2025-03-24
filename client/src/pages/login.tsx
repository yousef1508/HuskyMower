import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const user = await signInWithGoogle();
      await signIn(user);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary">
              <path fill="currentColor" d="M3,2H19.8C20.8,2 21.7,2.5 22.4,3.2C23,3.9 23.5,4.8 23.5,5.8H7.8C6.8,5.8 5.9,5.3 5.2,4.6C4.5,3.9 4,3 4,2ZM0.5,6H16.3C17.3,6 18.2,6.5 18.9,7.2C19.6,7.9 20.1,8.8 20.1,9.8H4.3C3.3,9.8 2.4,9.3 1.7,8.6C1,7.9 0.5,7 0.5,6ZM4.5,13.6C4.5,12.8 4.8,12 5.3,11.4C6,10.5 7,9.9 8.2,9.9H19.8C19.8,9.9 19.9,9.9 19.9,9.9C19.9,9.9 19.9,9.9 20,9.9V9.9C20.8,10 21.5,10.3 22.1,10.9C22.5,11.3 22.9,11.8 23.1,12.4C23.3,13 23.4,13.6 23.2,14.2L22,20.2C21.9,20.7 21.7,21.2 21.4,21.6C21,22.1 20.6,22.3 20,22.5C19.5,22.6 19,22.6 18.5,22.6H7.2C6.4,22.6 5.6,22.3 5,21.8C4.7,21.5 4.5,21.1 4.5,20.7V13.6Z"></path>
            </svg>
          </div>
          <CardTitle className="text-2xl">Husqvarna Lawnmower Management</CardTitle>
          <CardDescription>
            Sign in to manage your robotic lawnmowers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </span>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
