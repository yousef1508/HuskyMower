import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader } from "@/components/ui/card";
import MowerList from "./mower-list";

export default function MowerTabs() {
  const [activeTab, setActiveTab] = useState("all");

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

  const { data: mowersToDisplay, isLoading } = getDisplayData();

  return (
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
              mowers={mowersToDisplay || []}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
