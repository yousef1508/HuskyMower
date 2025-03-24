import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Tool, FileText, Image, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Fetch mowers to show in selector
  const { data: mowers, isLoading: mowersLoading } = useQuery({
    queryKey: ["/api/mowers"],
    staleTime: 30000,
  });

  // Fetch recent notes for all mowers
  const { data: recentNotes, isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes/recent"],
    staleTime: 30000,
  });

  // For a real application, we would implement pagination and filtering
  const filteredNotes = recentNotes && searchQuery
    ? recentNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentNotes;

  return (
    <AppLayout title="Maintenance">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h2 className="text-2xl font-semibold">Maintenance</h2>
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
            <Button className="flex items-center" onClick={() => navigate("/mowers")}>
              <Plus className="h-4 w-4 mr-2" /> Add Maintenance
            </Button>
          </div>
        </div>

        {/* Maintenance tabs */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border">
                <TabsTrigger value="notes" className="flex items-center">
                  <Tool className="h-4 w-4 mr-2" /> Notes
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> Documents
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center">
                  <Image className="h-4 w-4 mr-2" /> Photos
                </TabsTrigger>
              </TabsList>

              {/* Notes Tab */}
              <TabsContent value="notes" className="p-4">
                {notesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="bg-secondary/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                          <Skeleton className="h-16 w-full mt-2" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !filteredNotes || filteredNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <Tool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No maintenance notes found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Keep track of mower maintenance by adding notes about blade replacements, repairs, or regular service.
                    </p>
                    <Button onClick={() => navigate("/mowers")}>
                      Add Your First Maintenance Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => (
                      <Card key={note.id} className="bg-secondary/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{note.title}</h3>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 mb-2">
                            {note.content}
                          </p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{note.mower.name}</span>
                            <span>By: {note.createdBy || "Unknown"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="p-4">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Store important documents like manuals, warranties, or service records for your mowers.
                  </p>
                  <Button onClick={() => navigate("/mowers")}>
                    Upload Documents
                  </Button>
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="p-4">
                <div className="text-center py-12">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No photos found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Take and store photos of your mowers to document their condition or issues.
                  </p>
                  <Button onClick={() => navigate("/mowers")}>
                    Upload Photos
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Maintenance schedule and tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <h3 className="text-lg font-medium">Recommended Maintenance Schedule</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex justify-between border-b border-border pb-2">
                  <span>Blade replacement</span>
                  <span className="text-muted-foreground">Every 2-3 months</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>Cleaning</span>
                  <span className="text-muted-foreground">Every 2 weeks</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>Battery check</span>
                  <span className="text-muted-foreground">Monthly</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span>General inspection</span>
                  <span className="text-muted-foreground">Monthly</span>
                </li>
                <li className="flex justify-between">
                  <span>Winter storage preparation</span>
                  <span className="text-muted-foreground">Yearly</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <h3 className="text-lg font-medium">Maintenance Tips</h3>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Keep blades sharp for a clean cut and healthy lawn</li>
                <li>Clean the underside of the mower regularly to prevent build-up</li>
                <li>Check and clean wheels to ensure smooth movement</li>
                <li>Store your mower in a dry place during winter months</li>
                <li>Keep the charging station clean and free of debris</li>
                <li>Check the perimeter wire regularly for damage</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
