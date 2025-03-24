import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signInWithEmail } from "@/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";

// Create a schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      const user = await signInWithEmail(data.email, data.password);
      await signIn(user);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide user-friendly error messages based on Firebase error codes
      let errorMessage = "Could not sign in. Please check your credentials and try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter your email" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Signing In...
                  </span>
                ) : "Sign In"}
              </Button>
            </form>
          </Form>
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
