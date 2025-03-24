import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/firebase/config";
import { Bell, Cog, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border py-4 px-6 flex justify-between items-center bg-background">
        <div className="flex items-center space-x-4">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary">
            <path
              fill="currentColor"
              d="M3,2H19.8C20.8,2 21.7,2.5 22.4,3.2C23,3.9 23.5,4.8 23.5,5.8H7.8C6.8,5.8 5.9,5.3 5.2,4.6C4.5,3.9 4,3 4,2ZM0.5,6H16.3C17.3,6 18.2,6.5 18.9,7.2C19.6,7.9 20.1,8.8 20.1,9.8H4.3C3.3,9.8 2.4,9.3 1.7,8.6C1,7.9 0.5,7 0.5,6ZM4.5,13.6C4.5,12.8 4.8,12 5.3,11.4C6,10.5 7,9.9 8.2,9.9H19.8C19.8,9.9 19.9,9.9 19.9,9.9C19.9,9.9 19.9,9.9 20,9.9V9.9C20.8,10 21.5,10.3 22.1,10.9C22.5,11.3 22.9,11.8 23.1,12.4C23.3,13 23.4,13.6 23.2,14.2L22,20.2C21.9,20.7 21.7,21.2 21.4,21.6C21,22.1 20.6,22.3 20,22.5C19.5,22.6 19,22.6 18.5,22.6H7.2C6.4,22.6 5.6,22.3 5,21.8C4.7,21.5 4.5,21.1 4.5,20.7V13.6Z"
            ></path>
          </svg>
          <h1 className="text-xl font-semibold">Husqvarna Lawnmower Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>{userProfile?.name}</span>
            {userProfile?.role === "admin" && (
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                Admin
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Cog className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}
