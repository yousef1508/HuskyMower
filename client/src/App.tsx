import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Mowers from "./pages/mowers";
import Weather from "./pages/weather";
import Maintenance from "./pages/maintenance";
import { AuthProvider, useAuth } from "./hooks/use-auth";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [x: string]: any }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/mowers" component={() => <ProtectedRoute component={Mowers} />} />
      <Route path="/weather" component={() => <ProtectedRoute component={Weather} />} />
      <Route path="/maintenance" component={() => <ProtectedRoute component={Maintenance} />} />
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
