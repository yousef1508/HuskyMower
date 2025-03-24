import { useState } from "react";
import { useLocation } from "wouter";
import { Mower } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useControlMower, getStatusDisplay } from "@/hooks/use-automower";
import { Tractor, Pause, Home, CalendarCheck, Wrench, Info } from "lucide-react";
import MaintenanceModal from "@/components/maintenance/maintenance-modal";
import { formatDistanceToNow } from "date-fns";

interface MowerCardProps {
  mower: Mower;
}

export default function MowerCard({ mower }: MowerCardProps) {
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const { mutate: controlMower, isPending } = useControlMower();
  const [_, setLocation] = useLocation();
  
  const status = getStatusDisplay(mower.status || "unknown");
  const batteryLevel = mower.batteryLevel || 0;
  // Format last activity timestamp if it exists
  const getLastActiveText = () => {
    try {
      if (mower.lastActivity) {
        return formatDistanceToNow(new Date(mower.lastActivity), { addSuffix: true });
      }
      return mower.connectionStatus === "connected" ? "Online" : "Offline";
    } catch (error) {
      console.error("Error formatting lastActivity date:", error);
      return mower.connectionStatus === "connected" ? "Online" : "Offline";
    }
  };
  
  const lastActivity = getLastActiveText();
  
  // Battery color based on level
  const getBatteryColor = () => {
    if (batteryLevel > 60) return "bg-green-500 text-green-500";
    if (batteryLevel > 20) return "bg-yellow-500 text-yellow-500";
    return "bg-red-500 text-red-500";
  };
  
  const handleAction = (action: string) => {
    if (!mower.automowerId) return;
    
    controlMower({ mowerId: mower.automowerId, action });
  };
  
  const isOffline = mower.connectionStatus === "disconnected" || mower.status === "OFF";

  return (
    <>
      <Card className="bg-secondary/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary p-2 rounded-full">
                <Tractor className={`h-5 w-5 ${isOffline ? "text-red-500" : "text-green-500"}`} />
              </div>
              <div>
                <h3 className="font-medium">{mower.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Serial: {String(mower.serialNumber || "")}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900 dark:text-${status.color}-200`}
                >
                  {status.text}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Battery:</span>
                <div className="relative h-5 w-10 border-2 border-current rounded-sm">
                  <div 
                    className={`h-full ${getBatteryColor()}`} 
                    style={{ width: `${batteryLevel}%` }}
                  ></div>
                  <div className="absolute right-[-5px] top-[1px] h-3 w-1.5 bg-current rounded-r-sm"></div>
                </div>
                <span className="text-sm">{batteryLevel}%</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Last active:</span>
                <span className="text-sm">{lastActivity}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {mower.status === "MOWING" ? (
              <Button
                variant="default"
                className="text-sm"
                disabled={isPending || isOffline}
                onClick={() => handleAction("PAUSE")}
              >
                <Pause className="h-4 w-4 mr-1.5" /> Pause
              </Button>
            ) : (
              <Button
                variant={isOffline ? "outline" : "default"} 
                className="text-sm"
                disabled={isPending || isOffline}
                onClick={() => handleAction("START")}
              >
                <Tractor className="h-4 w-4 mr-1.5" /> Start
              </Button>
            )}
            
            <Button
              variant={mower.status === "PARKED_IN_CS" ? "default" : "outline"}
              className="text-sm"
              disabled={isPending || isOffline}
              onClick={() => handleAction("PARK")}
            >
              <Home className="h-4 w-4 mr-1.5" /> Park
            </Button>
            
            <Button
              variant="outline"
              className="text-sm"
              disabled={isPending || isOffline}
              onClick={() => handleAction("RESUME_SCHEDULE")}
            >
              <CalendarCheck className="h-4 w-4 mr-1.5" /> Resume Schedule
            </Button>
            
            <Button
              variant={showMaintenanceModal ? "default" : "outline"}
              className="text-sm"
              onClick={() => setShowMaintenanceModal(true)}
            >
              <Wrench className="h-4 w-4 mr-1.5" /> Maintenance
            </Button>
            
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => mower.id && setLocation(`/mowers/${mower.id}`)}
            >
              <Info className="h-4 w-4 mr-1.5" /> Details
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showMaintenanceModal && (
        <MaintenanceModal
          mower={mower}
          onClose={() => setShowMaintenanceModal(false)}
        />
      )}
    </>
  );
}
