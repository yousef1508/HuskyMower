import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Geofence, Zone, GeoPosition } from '@shared/schema';
import { useCreateGeofence, useUpdateGeofence, useCreateZone, useUpdateZone } from '@/hooks/use-geofencing';

interface GeofencingDialogProps {
  type: 'geofence' | 'zone';
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geofence?: Geofence;
  zone?: Zone;
  boundaries?: GeoPosition[];
}

const GeofencingDialog: React.FC<GeofencingDialogProps> = ({
  type,
  mode,
  open,
  onOpenChange,
  geofence,
  zone,
  boundaries = []
}) => {
  const { toast } = useToast();
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence(geofence?.id || 0);
  const createZone = useCreateZone();
  const updateZone = useUpdateZone(zone?.id || 0);
  
  // Form state
  const [name, setName] = useState(mode === 'edit' ? (type === 'geofence' ? geofence?.name : zone?.name) || '' : '');
  const [description, setDescription] = useState(
    mode === 'edit' ? (type === 'geofence' ? geofence?.description : zone?.description) || '' : ''
  );
  const [color, setColor] = useState(
    mode === 'edit' ? (type === 'geofence' ? geofence?.color : zone?.color) || '' : type === 'geofence' ? '#4CAF50' : '#2196F3'
  );
  const [zoneType, setZoneType] = useState(mode === 'edit' ? zone?.zoneType || 'normal' : 'normal');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (type === 'geofence') {
        const data = {
          name,
          description,
          color,
          boundaries: { coordinates: boundaries.length > 0 ? boundaries : (geofence?.boundaries as any)?.coordinates || [] },
          active: true
        };
        
        if (mode === 'create') {
          await createGeofence.mutateAsync(data);
          toast({
            title: 'Geofence created',
            description: 'The geofence has been created successfully.'
          });
        } else {
          await updateGeofence.mutateAsync(data);
          toast({
            title: 'Geofence updated',
            description: 'The geofence has been updated successfully.'
          });
        }
      } else {
        // Zone
        const data = {
          name,
          description,
          color,
          zoneType: zoneType as 'normal' | 'priority' | 'restricted',
          boundaries: { coordinates: boundaries.length > 0 ? boundaries : (zone?.boundaries as any)?.coordinates || [] },
          active: true
        };
        
        if (mode === 'create') {
          await createZone.mutateAsync(data);
          toast({
            title: 'Zone created',
            description: 'The zone has been created successfully.'
          });
        } else {
          await updateZone.mutateAsync(data);
          toast({
            title: 'Zone updated',
            description: 'The zone has been updated successfully.'
          });
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: `Failed to ${mode} ${type}. Please try again.`,
        variant: 'destructive'
      });
    }
  };
  
  const isLoading = 
    (type === 'geofence' && (createGeofence.isPending || updateGeofence.isPending)) || 
    (type === 'zone' && (createZone.isPending || updateZone.isPending));
  
  const hasEnoughPoints = boundaries.length >= 3 || 
    ((type === 'geofence' ? (geofence?.boundaries as any)?.coordinates?.length : (zone?.boundaries as any)?.coordinates?.length) >= 3);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? `Create New ${type === 'geofence' ? 'Geofence' : 'Zone'}` : `Edit ${type === 'geofence' ? 'Geofence' : 'Zone'}`}
          </DialogTitle>
          <DialogDescription>
            {type === 'geofence' 
              ? 'Define a geofence boundary to monitor mower location.' 
              : 'Create a zone for scheduling specific mowing patterns.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3" 
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="col-span-3" 
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input 
                  id="color" 
                  type="color"
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="w-14 h-10 p-1" 
                />
                <Input 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="flex-1" 
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#000000"
                />
              </div>
            </div>
            
            {type === 'zone' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zoneType" className="text-right">Zone Type</Label>
                <Select value={zoneType} onValueChange={setZoneType}>
                  <SelectTrigger id="zoneType" className="col-span-3">
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Boundary Points</Label>
              <div className="col-span-3 text-sm">
                {boundaries.length > 0
                  ? `${boundaries.length} points defined`
                  : mode === 'edit'
                    ? `${(type === 'geofence' ? (geofence?.boundaries as any)?.coordinates?.length : (zone?.boundaries as any)?.coordinates?.length) || 0} points defined`
                    : 'No points defined yet'}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name || !hasEnoughPoints}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GeofencingDialog;