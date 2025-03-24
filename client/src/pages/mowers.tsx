import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import MowerList from "@/components/mowers/mower-list";
import { Search, RefreshCw, Plus } from "lucide-react";
import { Mower, AutomowerStatus } from "@shared/schema";
import { useAutomowers } from "@/hooks/use-automower";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert AutomowerStatus to Mower format
const automowerToMower = (automower: AutomowerStatus): Mower => {
  return {
    id: parseInt(automower.id) || Math.floor(Math.random() * 10000),
    userId: 0, // Not used in display
    name: `${automower.model || "Automower"} (${automower.serialNumber.slice(-6)})`,
    model: automower.model || "",
    serialNumber: automower.serialNumber || "",
    type: "automower",
    status: automower.status,
    batteryLevel: automower.batteryLevel,
    lastActivity: automower.lastActivity,
    connectionStatus: automower.connectionStatus,
    automowerId: automower.id,
    // Convert string dates to Date objects
    purchaseDate: new Date(),
    warrantyExpiration: new Date(),
    createdAt: new Date(),
    // Fields not used but needed for type compatibility
    installationDate: null,
    coverageArea: null,
    latitude: null,
    longitude: null
  };
};

export default function Mowers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch automowers from Husqvarna API
  const { 
    data: automowerData, 
    isLoading: automowerLoading,
    refetch: refetchAutomowers,
    isError: automowerError
  } = useAutomowers();

  // Convert AutomowerStatus array to Mower array
  const mowers = automowerData ? automowerData.map(automowerToMower) : [];
  const isLoading = automowerLoading;

  // Handle refresh
  const handleRefresh = async () => {
    toast({
      title: "Refreshing Automowers",
      description: "Fetching the latest data from Husqvarna..."
    });
    await refetchAutomowers();
  };

  // Filter mowers by search query
  const filteredMowers = mowers && searchQuery
    ? mowers.filter((mower: Mower) => 
        mower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mower.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mower.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mowers;

  return (
    <AppLayout title="Mowers">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h2 className="text-2xl font-semibold">Mowers</h2>
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

        {/* Mower listing */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Husqvarna Automowers</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <div className="p-4 pt-0">
            <MowerList
              mowers={filteredMowers || []}
              isLoading={isLoading}
            />
            {automowerError && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mt-4">
                <h4 className="font-medium">Error connecting to Husqvarna API</h4>
                <p className="text-sm mt-1">
                  Unable to fetch your Automowers. Please check your connection and try again.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Mower management guidance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-border bg-card col-span-1 md:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-medium">Mower Management</h3>
            </CardHeader>
            <div className="p-6 pt-0">
              <p className="text-muted-foreground mb-4">
                Use the controls above to manage your Husqvarna robotic lawnmowers. You can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>View the status of all your mowers in real-time</li>
                <li>Start, stop, pause, or park individual mowers</li>
                <li>View battery levels and recent activity</li>
                <li>Schedule mowing sessions for optimal lawn care</li>
                <li>Access maintenance records and add new maintenance entries</li>
              </ul>
            </div>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <h3 className="text-lg font-medium">Connection Status</h3>
            </CardHeader>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Husqvarna API:</span>
                  <span className="flex items-center text-green-500">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div> Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last sync:</span>
                  <span className="text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Connection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
