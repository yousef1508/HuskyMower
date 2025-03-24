import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAutomowerStatus, getStatusDisplay } from "@/hooks/use-automower";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mower } from "@shared/schema";
import { Tractor, Battery, Calendar, MapPin, Clock, Info, Settings, History, FileText, Image } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import MaintenanceModal from "@/components/maintenance/maintenance-modal";

export default function MowerDetails() {
  const [_, params] = useRoute<{ id: string }>("/mowers/:id");
  const mowerId = params?.id;
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  
  // Get mower info from database
  const { data: mower, isLoading: mowerLoading } = useQuery<Mower>({
    queryKey: [`/api/mowers/${mowerId}`],
    enabled: !!mowerId,
  });
  
  // Get real-time status from Automower API if we have the automowerId
  const { data: automowerStatus, isLoading: statusLoading } = useAutomowerStatus(
    mower?.automowerId || ""
  );
  
  const isLoading = mowerLoading || statusLoading;
  
  // Merge data from both sources
  const mowerData = {
    ...mower,
    ...(automowerStatus || {}),
  };
  
  const status = getStatusDisplay(mowerData.status || "unknown");
  
  if (isLoading) {
    return (
      <AppLayout title="Mower Details">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 bg-secondary rounded"></div>
          <div className="h-64 bg-secondary rounded"></div>
          <div className="h-96 bg-secondary rounded"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!mower) {
    return (
      <AppLayout title="Mower Not Found">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Mower not found</h2>
          <p className="text-muted-foreground mt-2">The mower you're looking for doesn't exist or you don't have access to it.</p>
          <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title={`Mower: ${mower.name}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{mower.name}</h1>
          <Button onClick={() => setShowMaintenanceModal(true)}>Add Maintenance</Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Status</span>
                </div>
                <div className="flex items-center">
                  <Badge 
                    variant="outline"
                    className={`bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900 dark:text-${status.color}-200`}
                  >
                    {status.text}
                  </Badge>
                </div>
              </div>
              
              {/* Battery */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Battery className="w-4 h-4 mr-2" />
                  <span>Battery</span>
                </div>
                <div>
                  <Progress value={mowerData.batteryLevel || 0} className="h-2" />
                  <p className="text-sm mt-1">{mowerData.batteryLevel || 0}%</p>
                </div>
              </div>
              
              {/* Model */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Tractor className="w-4 h-4 mr-2" />
                  <span>Model</span>
                </div>
                <p>{mowerData.model || 'Unknown'}</p>
              </div>
              
              {/* Serial */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Serial Number</span>
                </div>
                <p>{mowerData.serialNumber || 'Unknown'}</p>
              </div>
              
              {/* Last Active */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Last Activity</span>
                </div>
                <p>
                  {mowerData.lastActivity 
                    ? formatDistanceToNow(new Date(mowerData.lastActivity), { addSuffix: true }) 
                    : 'Unknown'}
                </p>
              </div>
              
              {/* Mode */}
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Mode</span>
                </div>
                <p>{mowerData.modeOfOperation || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="information">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="information" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mower Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Specifications</h3>
                    <Separator className="my-2" />
                    <dl className="grid grid-cols-3 gap-1 text-sm">
                      <dt className="col-span-1 text-muted-foreground">Type:</dt>
                      <dd className="col-span-2">{mower.type || 'Automower'}</dd>
                      
                      <dt className="col-span-1 text-muted-foreground">Model:</dt>
                      <dd className="col-span-2">{mowerData.model || 'Unknown'}</dd>
                      
                      <dt className="col-span-1 text-muted-foreground">Manufacturer:</dt>
                      <dd className="col-span-2">{mowerData.manufacturer || 'Husqvarna'}</dd>
                      
                      <dt className="col-span-1 text-muted-foreground">Serial:</dt>
                      <dd className="col-span-2">{mowerData.serialNumber || 'Unknown'}</dd>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Location & Coverage</h3>
                    <Separator className="my-2" />
                    <dl className="grid grid-cols-3 gap-1 text-sm">
                      <dt className="col-span-1 text-muted-foreground">Location:</dt>
                      <dd className="col-span-2">
                        {mowerData.latitude && mowerData.longitude ? (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {mowerData.latitude.toFixed(6)}, {mowerData.longitude.toFixed(6)}
                          </div>
                        ) : (
                          'Unknown'
                        )}
                      </dd>
                      
                      <dt className="col-span-1 text-muted-foreground">Coverage:</dt>
                      <dd className="col-span-2">{mower.coverageArea ? `${mower.coverageArea} m²` : 'Unknown'}</dd>
                      
                      <dt className="col-span-1 text-muted-foreground">Zones:</dt>
                      <dd className="col-span-2">Coming soon</dd>
                    </dl>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">History & Statistics</h3>
                  <Separator className="my-2" />
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="grid grid-cols-3 gap-1">
                      <dt className="col-span-1 text-muted-foreground">Purchase Date:</dt>
                      <dd className="col-span-2">{mower.purchaseDate ? format(new Date(mower.purchaseDate), 'MMM d, yyyy') : 'Unknown'}</dd>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <dt className="col-span-1 text-muted-foreground">Last Maintenance:</dt>
                      <dd className="col-span-2">Coming soon</dd>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <dt className="col-span-1 text-muted-foreground">Working Hours:</dt>
                      <dd className="col-span-2">{mower.workingHours || 'Unknown'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <Separator className="my-2" />
                  <p className="text-sm">{mower.notes || 'No notes available'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Maintenance History</span>
                  <Button size="sm" onClick={() => setShowMaintenanceModal(true)}>Add Entry</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium">No maintenance records</h3>
                  <p className="text-sm mt-1">Start keeping track of maintenance by adding your first entry</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Documents</span>
                  <Button size="sm">Upload Document</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium">No documents</h3>
                  <p className="text-sm mt-1">Upload manuals, warranties, or other important documents</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Photos</span>
                  <Button size="sm">Upload Photo</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="font-medium">No photos</h3>
                  <p className="text-sm mt-1">Add photos of the mower or the area it covers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {showMaintenanceModal && (
        <MaintenanceModal
          mower={mower}
          onClose={() => setShowMaintenanceModal(false)}
        />
      )}
    </AppLayout>
  );
}