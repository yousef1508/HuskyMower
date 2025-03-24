import AppLayout from "@/components/layout/app-layout";
import MowerStats from "@/components/mowers/mower-stats";
import MowerTabs from "@/components/mowers/mower-tabs";
import WeatherForecast from "@/components/weather/weather-forecast";
import MaintenanceNotes from "@/components/maintenance/maintenance-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all mowers for the dashboard
  const { data: mowers, isLoading: mowersLoading } = useQuery({
    queryKey: ["/api/mowers"],
    staleTime: 30000,
  });
  
  // Get recent maintenance notes
  const { data: recentNotes, isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes/recent"],
    staleTime: 30000,
  });

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

        {/* Mower list */}
        <MowerTabs />

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
