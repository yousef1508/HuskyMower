import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import type { Geofence, Zone, MowerZone, GeoPolygon } from "@shared/schema";

// Geofence hooks
export const useGeofences = () => {
  return useQuery({
    queryKey: ['/api/geofences'],
    queryFn: getQueryFn({
      url: '/api/geofences',
      on401: "throw",
    }),
  });
};

export const useGeofence = (id: number) => {
  return useQuery({
    queryKey: ['/api/geofences', id],
    queryFn: getQueryFn({
      url: `/api/geofences/${id}`,
      on401: "throw",
    }),
    enabled: !!id,
  });
};

export const useCreateGeofence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (geofence: { 
      name: string;
      description?: string;
      boundaries: GeoPolygon;
      active?: boolean;
      color?: string;
    }) => {
      const response = await apiRequest('/api/geofences', {
        method: 'POST',
        body: JSON.stringify(geofence),
      });
      return response.json() as Promise<Geofence>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
    },
  });
};

export const useUpdateGeofence = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (geofence: Partial<Geofence>) => {
      const response = await apiRequest(`/api/geofences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(geofence),
      });
      return response.json() as Promise<Geofence>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/geofences', id] });
    },
  });
};

export const useDeleteGeofence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/geofences/${id}`, {
        method: 'DELETE',
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
    },
  });
};

// Zone hooks
export const useZones = () => {
  return useQuery({
    queryKey: ['/api/zones'],
    queryFn: getQueryFn({
      url: '/api/zones',
      on401: "throw",
    }),
  });
};

export const useZone = (id: number) => {
  return useQuery({
    queryKey: ['/api/zones', id],
    queryFn: getQueryFn({
      url: `/api/zones/${id}`,
      on401: "throw",
    }),
    enabled: !!id,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (zone: { 
      name: string;
      description?: string;
      boundaries: GeoPolygon;
      zoneType?: 'normal' | 'restricted' | 'priority';
      schedule?: any;
      active?: boolean;
      color?: string;
    }) => {
      const response = await apiRequest('/api/zones', {
        method: 'POST',
        body: JSON.stringify(zone),
      });
      return response.json() as Promise<Zone>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
    },
  });
};

export const useUpdateZone = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (zone: Partial<Zone>) => {
      const response = await apiRequest(`/api/zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(zone),
      });
      return response.json() as Promise<Zone>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/zones', id] });
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/zones/${id}`, {
        method: 'DELETE',
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
    },
  });
};

// Mower Zone hooks
export const useMowerZones = (mowerId: number) => {
  return useQuery({
    queryKey: ['/api/mowers', mowerId, 'zones'],
    queryFn: getQueryFn({
      url: `/api/mowers/${mowerId}/zones`,
      on401: "throw",
    }),
    enabled: !!mowerId,
  });
};

export const useAssignZoneToMower = (mowerId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      zoneId: number;
      priority?: number;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      daysOfWeek?: string[];
    }) => {
      const response = await apiRequest(`/api/mowers/${mowerId}/zones`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json() as Promise<MowerZone>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mowers', mowerId, 'zones'] });
    },
  });
};

export const useRemoveZoneFromMower = (mowerId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (zoneId: number) => {
      await apiRequest(`/api/mowers/${mowerId}/zones/${zoneId}`, {
        method: 'DELETE',
      });
      return zoneId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mowers', mowerId, 'zones'] });
    },
  });
};