import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import MowerList from "@/components/mowers/mower-list";
import { Search, RefreshCw, Plus } from "lucide-react";
import { Mower, AutomowerStatus } from "@shared/schema";
import { useAutomowers, useRegisterAutomower, automowerToMower } from "@/hooks/use-automower";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Mowers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [storedMowerIds, setStoredMowerIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch automowers from Husqvarna API
  const { 
    data: automowerData, 
    isLoading: automowerLoading,
    refetch: refetchAutomowers,
    isError: automowerError
  } = useAutomowers();

  // Register mower mutation
  const registerMutation = useRegisterAutomower();
  
  // Fetch existing mowers to check if we need to register any
  const fetchStoredMowers = async () => {
    try {
      const storedMowers = await apiRequest('/api/mowers');
      const storedIds = storedMowers.map((mower: Mower) => mower.automowerId);
      setStoredMowerIds(storedIds);
      return storedIds;
    } catch (error) {
      console.error("Error fetching stored mowers:", error);
      return [];
    }
  };
  
  // Register automowers that don't exist in the database
  useEffect(() => {
    if (automowerData && automowerData.length > 0) {
      (async () => {
        const storedIds = await fetchStoredMowers();
        
        for (const automower of automowerData) {
          if (!storedIds.includes(automower.id)) {
            console.log("Registering mower:", automower.id);
            try {
              await registerMutation.mutateAsync(automower);
            } catch (error) {
              console.error("Failed to register mower:", automower.id, error);
            }
          }
        }
      })();
    }
  }, [automowerData]);

  // Convert AutomowerStatus array to Mower array
  const mowers = automowerData ? automowerData.map(automower => automowerToMower(automower)) : [];
  const isLoading = automowerLoading || registerMutation.isPending;

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
