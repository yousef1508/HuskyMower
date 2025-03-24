import React, { useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import GeofencingMap from '@/components/geofencing/geofencing-map';
import GeofencingDialog from '@/components/geofencing/geofencing-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGeofences, useZones, useDeleteGeofence, useDeleteZone } from '@/hooks/use-geofencing';
import { useAutomowers } from '@/hooks/use-automower';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Edit, MapPin } from 'lucide-react';
import type { Geofence, Zone, GeoPosition, AutomowerStatus } from '@shared/schema';

const GeofencingPage: React.FC = () => {
  const { toast } = useToast();
  const { data: geofences, isLoading: geofencesLoading } = useGeofences();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: mowers, isLoading: mowersLoading } = useAutomowers();
  const deleteGeofence = useDeleteGeofence();
  const deleteZone = useDeleteZone();
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'geofence' | 'zone'>('geofence');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | undefined>();
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>();
  const [drawnBoundaries, setDrawnBoundaries] = useState<GeoPosition[]>([]);
  
  // State for drawing mode
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('geofences');
  
  // Handle opening the dialog for creating
  const handleCreateClick = (type: 'geofence' | 'zone') => {
    setDialogType(type);
    setDialogMode('create');
    setSelectedGeofence(undefined);
    setSelectedZone(undefined);
    setDrawnBoundaries([]);
    setIsDrawing(true);
    setDialogOpen(true);
  };
  
  // Handle opening the dialog for editing
  const handleEditClick = (item: Geofence | Zone, type: 'geofence' | 'zone') => {
    setDialogType(type);
    setDialogMode('edit');
    if (type === 'geofence') {
      setSelectedGeofence(item as Geofence);
      setSelectedZone(undefined);
    } else {
      setSelectedZone(item as Zone);
      setSelectedGeofence(undefined);
    }
    setDrawnBoundaries([]);
    setDialogOpen(true);
  };
  
  // Handle deleting
  const handleDeleteClick = async (id: number, type: 'geofence' | 'zone') => {
    try {
      if (type === 'geofence') {
        await deleteGeofence.mutateAsync(id);
        toast({
          title: 'Geofence deleted',
          description: 'The geofence has been deleted successfully.'
        });
      } else {
        await deleteZone.mutateAsync(id);
        toast({
          title: 'Zone deleted',
          description: 'The zone has been deleted successfully.'
        });
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: 'Error',
        description: `Failed to delete ${type}. Please try again.`,
        variant: 'destructive'
      });
    }
  };
  
  // Handle drawing completion
  const handleDrawComplete = (positions: GeoPosition[]) => {
    setDrawnBoundaries(positions);
    setIsDrawing(false);
  };
  
  // Determine center position for map based on mowers
  const getCenterPosition = (): [number, number] => {
    if (mowers && Array.isArray(mowers) && mowers.length > 0) {
      const mower = mowers.find((m: AutomowerStatus) => m.latitude && m.longitude);
      if (mower && mower.latitude && mower.longitude) {
        return [mower.latitude, mower.longitude];
      }
    }
    return [59.7907, 10.7686]; // Default to Gjersjøen Golf Club
  };
  
  const isLoading = geofencesLoading || zonesLoading || mowersLoading;
  
  return (
    <AppLayout title="Geofencing & Zones">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Geofencing & Zone Management</h1>
          <div className="flex gap-3">
            <Button 
              onClick={() => handleCreateClick('geofence')} 
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Geofence
            </Button>
            <Button 
              onClick={() => handleCreateClick('zone')} 
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Zone
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Map */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-0">
                <CardTitle>Map View</CardTitle>
                <CardDescription>
                  {isDrawing 
                    ? 'Click on the map to add points. Finish drawing to save.' 
                    : 'View and manage geofences and zones.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="h-[70vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <GeofencingMap
                    geofences={activeTab === 'geofences' ? geofences || [] : []}
                    zones={activeTab === 'zones' ? zones || [] : []}
                    mowers={(mowers || []) as AutomowerStatus[]}
                    center={getCenterPosition()}
                    onGeofenceClick={(geofence) => handleEditClick(geofence, 'geofence')}
                    onZoneClick={(zone) => handleEditClick(zone, 'zone')}
                    drawing={isDrawing}
                    onDrawComplete={handleDrawComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* List View */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-0">
                <CardTitle>Geofences & Zones</CardTitle>
                <CardDescription>Manage your boundaries and zones</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs defaultValue="geofences" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="geofences">Geofences</TabsTrigger>
                    <TabsTrigger value="zones">Zones</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="geofences" className="h-[65vh] overflow-y-auto">
                    {geofencesLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : geofences && geofences.length > 0 ? (
                      <div className="space-y-3">
                        {geofences.map((geofence) => (
                          <div 
                            key={geofence.id} 
                            className="border rounded-lg p-3 flex justify-between items-start"
                          >
                            <div className="flex items-start gap-2">
                              <div 
                                className="h-4 w-4 rounded-full mt-1" 
                                style={{ backgroundColor: geofence.color || '#4CAF50' }}
                              />
                              <div>
                                <h3 className="font-medium">{geofence.name}</h3>
                                {geofence.description && (
                                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {geofence.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditClick(geofence, 'geofence')}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteClick(geofence.id, 'geofence')}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No geofences defined yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => handleCreateClick('geofence')}
                        >
                          Create Geofence
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="zones" className="h-[65vh] overflow-y-auto">
                    {zonesLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : zones && zones.length > 0 ? (
                      <div className="space-y-3">
                        {zones.map((zone) => (
                          <div 
                            key={zone.id} 
                            className="border rounded-lg p-3 flex justify-between items-start"
                          >
                            <div className="flex items-start gap-2">
                              <div 
                                className="h-4 w-4 rounded-full mt-1" 
                                style={{ backgroundColor: zone.color || '#2196F3' }}
                              />
                              <div>
                                <h3 className="font-medium">{zone.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  Type: {zone.zoneType || 'normal'}
                                </p>
                                {zone.description && (
                                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {zone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditClick(zone, 'zone')}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteClick(zone.id, 'zone')}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No zones defined yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => handleCreateClick('zone')}
                        >
                          Create Zone
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Dialog for creating/editing */}
      <GeofencingDialog
        type={dialogType}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        geofence={selectedGeofence}
        zone={selectedZone}
        boundaries={drawnBoundaries}
      />
    </AppLayout>
  );
};

export default GeofencingPage;