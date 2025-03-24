import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AutomowerStatus, Mower } from "@shared/schema";

export const useAutomowers = () => {
  return useQuery<AutomowerStatus[]>({
    queryKey: ["/api/automower/mowers"],
    staleTime: 30000, // 30s stale time as per requirements
  });
};

export const useAutomowerStatus = (mowerId: string) => {
  return useQuery<AutomowerStatus>({
    queryKey: ["/api/automower/mowers", mowerId],
    staleTime: 30000, // 30s stale time
    enabled: !!mowerId,
  });
};

export const useControlMower = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ mowerId, action }: { mowerId: string; action: string }) => {
      return apiRequest(`/api/automower/mowers/${mowerId}/action`, {
        method: 'POST', 
        body: JSON.stringify({ action })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automower/mowers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automower/mowers", variables.mowerId] });
      
      const actionMessages: Record<string, string> = {
        START: "Started mowing",
        STOP: "Stopped mowing",
        PARK: "Parked at charging station",
        PARK_UNTIL_NEXT_TASK: "Parked until next scheduled task",
        PARK_UNTIL_FURTHER_NOTICE: "Parked until further notice",
        RESUME_SCHEDULE: "Resumed schedule"
      };
      
      toast({
        title: "Mower Control",
        description: actionMessages[variables.action] || "Action performed successfully",
      });
    },
    onError: (error) => {
      console.error("Mower control error:", error);
      toast({
        title: "Mower Control Error",
        description: "Failed to control mower. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Convert AutomowerStatus to a format that can be saved in the database
export const automowerToMower = (automower: AutomowerStatus): Mower => {
  return {
    id: parseInt(automower.id.substring(0, 8), 16) || Math.floor(Math.random() * 10000),
    userId: 1, // Default user ID
    name: `${automower.model || "Automower"} (${String(automower.serialNumber || "").slice(-6) || "Unknown"})`,
    model: automower.model || "",
    serialNumber: automower.serialNumber ? String(automower.serialNumber) : "",
    type: "automower",
    status: automower.status || "UNKNOWN",
    batteryLevel: automower.batteryLevel || 0,
    lastActivity: automower.lastActivity ? new Date(automower.lastActivity) : new Date(),
    connectionStatus: automower.connectionStatus || "disconnected",
    automowerId: automower.id,
    latitude: automower.latitude || null,
    longitude: automower.longitude || null,
    installationDate: new Date(),
    coverageArea: 0,
    createdAt: new Date()
  };
};

// Hook to register an automower in the database
export const useRegisterAutomower = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (automower: AutomowerStatus) => {
      return apiRequest('/api/automower/register', {
        method: 'POST',
        body: JSON.stringify({ automowerId: automower.id })
      });
    },
    onSuccess: (data: Mower) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mowers"] });
      toast({
        title: "Mower Registered",
        description: `Successfully registered ${data.name} in the database.`,
      });
      return data;
    },
    onError: (error) => {
      console.error("Failed to register mower:", error);
      toast({
        title: "Registration Error",
        description: "Failed to register mower in the database.",
        variant: "destructive",
      });
    }
  });
};

// Map backend status to friendly display status
export const getStatusDisplay = (status: string): { text: string; color: string } => {
  const statusMap: Record<string, { text: string; color: string }> = {
    MOWING: { text: "Mowing", color: "green" },
    CHARGING: { text: "Charging", color: "yellow" },
    LEAVING: { text: "Leaving", color: "blue" },
    GOING_HOME: { text: "Going Home", color: "blue" },
    PARKED_IN_CS: { text: "Parked", color: "gray" },
    STOPPED_IN_GARDEN: { text: "Stopped", color: "red" },
    ERROR: { text: "Error", color: "red" },
    OFF: { text: "Off", color: "gray" },
    PAUSED: { text: "Paused", color: "yellow" },
  };
  
  return statusMap[status] || { text: status, color: "gray" };
};
