import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader } from "@/components/ui/card";
import MowerList from "@/components/mowers/mower-list";
import { Search, Plus } from "lucide-react";
import { Mower } from "@shared/schema";

export default function Mowers() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all mowers
  const { data: allMowers, isLoading: allLoading } = useQuery({
    queryKey: ["/api/mowers"],
    staleTime: 30000,
  });
  
  // Fetch automowers
  const { data: automowers, isLoading: autoLoading } = useQuery({
    queryKey: ["/api/mowers/type/automower"],
    staleTime: 30000,
    enabled: activeTab === "automower",
  });
  
  // Fetch standard mowers
  const { data: standardMowers, isLoading: standardLoading } = useQuery({
    queryKey: ["/api/mowers/type/standard"],
    staleTime: 30000,
    enabled: activeTab === "standard",
  });

  const getDisplayData = () => {
    switch (activeTab) {
      case "automower":
        return { data: automowers, isLoading: autoLoading };
      case "standard":
        return { data: standardMowers, isLoading: standardLoading };
      default:
        return { data: allMowers, isLoading: allLoading };
    }
  };

  const { data: mowers, isLoading } = getDisplayData();

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

        {/* Mower tabs and listing */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border">
                <TabsTrigger value="all">All Mowers</TabsTrigger>
                <TabsTrigger value="automower">Automowers</TabsTrigger>
                <TabsTrigger value="standard">Standard Mowers</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="p-4">
                <MowerList
                  mowers={filteredMowers || []}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardHeader>
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
                <Button variant="outline" className="w-full mt-2">
                  Refresh Connection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
