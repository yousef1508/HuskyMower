import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import type { Geofence, Zone, MowerZone, GeoPolygon } from '@shared/schema';

// Geofence hooks
export const useGeofences = () => {
  return useQuery<Geofence[]>({
    queryKey: ['/api/geofences'],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnWindowFocus: false,
  });
};

export const useGeofence = (id: number) => {
  return useQuery<Geofence>({
    queryKey: ['/api/geofences', id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
};

export const useCreateGeofence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      boundaries: GeoPolygon;
      active?: boolean;
      color?: string;
    }) => {
      return apiRequest('/api/geofences', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
    },
  });
};

export const useUpdateGeofence = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Geofence>) => {
      return apiRequest(`/api/geofences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
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
      return apiRequest(`/api/geofences/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
    },
  });
};

// Zone hooks
export const useZones = () => {
  return useQuery<Zone[]>({
    queryKey: ['/api/zones'],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnWindowFocus: false,
  });
};

export const useZone = (id: number) => {
  return useQuery<Zone>({
    queryKey: ['/api/zones', id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      boundaries: GeoPolygon;
      zoneType?: 'normal' | 'priority' | 'restricted';
      schedule?: any;
      active?: boolean;
      color?: string;
    }) => {
      return apiRequest('/api/zones', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
    },
  });
};

export const useUpdateZone = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Zone>) => {
      return apiRequest(`/api/zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
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
      return apiRequest(`/api/zones/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
    },
  });
};

// Mower Zone hooks
export const useMowerZones = (mowerId: number) => {
  return useQuery<(MowerZone & { zone: Zone })[]>({
    queryKey: ['/api/mowers', mowerId, 'zones'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!mowerId,
    refetchOnWindowFocus: false,
  });
};

export const useAssignZoneToMower = (mowerId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (zoneId: number) => {
      return apiRequest(`/api/mowers/${mowerId}/zones`, {
        method: 'POST',
        body: JSON.stringify({ zoneId }),
      });
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
      return apiRequest(`/api/mowers/${mowerId}/zones/${zoneId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mowers', mowerId, 'zones'] });
    },
  });
};