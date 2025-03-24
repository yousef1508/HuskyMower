import AppLayout from "@/components/layout/app-layout";
import MowerStats from "@/components/mowers/mower-stats";
import MowerList from "@/components/mowers/mower-list";
import WeatherForecast from "@/components/weather/weather-forecast";
import MaintenanceNotes from "@/components/maintenance/maintenance-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useWeatherForecast } from "@/hooks/use-weather";
import { useAutomowers } from "@/hooks/use-automower";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AutomowerStatus, Mower } from "@shared/schema";

// Component to fetch weather data and pass it to the WeatherForecast component
function WeatherForecastWithData() {
  const { data: forecast, isLoading } = useWeatherForecast();
  return <WeatherForecast forecast={forecast} isLoading={isLoading} />;
}

// Helper function to convert AutomowerStatus to Mower type
const automowerToMower = (automower: AutomowerStatus): Mower => {
  const now = new Date();
  
  // Parse lastActivity to Date if it exists
  let lastActivity: Date | null = now;
  if (automower.lastActivity) {
    try {
      lastActivity = new Date(automower.lastActivity);
    } catch (e) {
      console.error("Error parsing date:", e);
      lastActivity = now;
    }
  }
  
  return {
    id: parseInt(automower.id) || Math.floor(Math.random() * 1000), // Fallback to random ID if can't parse
    name: automower.model || "Automower",
    type: "automower",
    model: automower.model || "",
    serialNumber: automower.serialNumber || "",
    status: automower.status || "unknown",
    batteryLevel: automower.batteryLevel || 0,
    lastActivity: lastActivity,
    connectionStatus: automower.connectionStatus || "disconnected",
    automowerId: automower.id,
    userId: 1, // Default userId
    createdAt: now,
    coverageArea: null,
    installationDate: null,
    latitude: automower.latitude === undefined ? null : automower.latitude,
    longitude: automower.longitude === undefined ? null : automower.longitude,
  };
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all mowers for the dashboard (from database)
  const { data: mowers, isLoading: mowersLoading } = useQuery({
    queryKey: ["/api/mowers"],
    staleTime: 30000,
  });
  
  // Fetch real-time automower data from the Husqvarna API
  const { data: automowers, isLoading: automowersLoading } = useAutomowers();
  
  // Get recent maintenance notes
  const { data: recentNotes, isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes/recent"],
    staleTime: 30000,
  });
  
  // Convert automowers to the mower format for display
  const automowersAsMowers = automowers?.map(automowerToMower) || [];
  const isLoading = automowersLoading;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                className="pr-10 w-full md:w-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Add Mower
            </Button>
          </div>
        </div>

        {/* Mower stats */}
        <MowerStats />

        {/* Mower list - using real-time automower data */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle>Your Automowers</CardTitle>
          </CardHeader>
          <CardContent>
            <MowerList
              mowers={automowersAsMowers}
              isLoading={automowersLoading}
            />
          </CardContent>
        </Card>

        {/* Weather forecast and maintenance notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Use the weather hook to provide data to the component */}
            <WeatherForecastWithData />
          </div>
          <div>
            <MaintenanceNotes />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
