import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AutomowerStatus } from "@shared/schema";

export const useAutomowers = () => {
  return useQuery({
    queryKey: ["/api/automower/mowers"],
    staleTime: 30000, // 30s stale time as per requirements
  });
};

export const useAutomowerStatus = (mowerId: string) => {
  return useQuery({
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
      const res = await apiRequest("POST", `/api/automower/mowers/${mowerId}/action`, { action });
      return res.json();
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
