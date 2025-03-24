import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthStateChanged, getCurrentUser } from "@/firebase/config";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Register Firebase user with our backend
  const registerWithBackend = async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      
      const response = await apiRequest("POST", "/api/auth/firebase", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      
      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }
      
      const profile = await response.json();
      setUserProfile(profile);
      
      return profile;
    } catch (error) {
      console.error("Backend registration error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign in
  const signIn = async (firebaseUser: User) => {
    try {
      await registerWithBackend(firebaseUser);
      setUser(firebaseUser);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await apiRequest("GET", "/api/auth/logout");
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await registerWithBackend(firebaseUser);
          setUser(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth state changed error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
