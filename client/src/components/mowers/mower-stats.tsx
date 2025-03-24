import { Card, CardContent } from "@/components/ui/card";
import { Tractor, Play, Zap, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { useAutomowers } from "@/hooks/use-automower";
import { AutomowerStatus } from "@shared/schema";

export default function MowerStats() {
  // Fetch directly from Automower API for real-time data
  const { data: automowers, isLoading: autoLoading } = useAutomowers();

  // Log the automowers data to check what we're receiving
  console.log("Automowers data:", automowers);
  
  // Calculate stats based on automower data
  const calculateStats = () => {
    if (!automowers || !Array.isArray(automowers) || automowers.length === 0) {
      return {
        total: 0,
        active: 0,
        charging: 0,
        offline: 0,
        totalChange: 0,
        activeChange: 0,
        chargingChange: 0,
        offlineChange: 0
      };
    }
    
    // Count total mowers
    const total = automowers.length;
    
    // Count mowers by status
    const active = automowers.filter((m: AutomowerStatus) => 
      m.status === 'MOWING' || m.status === 'LEAVING'
    ).length;
    
    const charging = automowers.filter((m: AutomowerStatus) => 
      m.status === 'CHARGING' || m.status === 'PARKED_IN_CS'
    ).length;
    
    const offline = automowers.filter((m: AutomowerStatus) => 
      m.status === 'OFF' || m.connectionStatus === 'disconnected' || 
      m.status === 'ERROR' || m.status === 'STOPPED_IN_GARDEN'
    ).length;
    
    // Since we don't have historical data for comparison, we'll show 0 for changes
    // This is more accurate than showing arbitrary numbers
    const totalChange = 0;
    const activeChange = 0;
    const chargingChange = 0;
    const offlineChange = 0;
    
    return {
      total,
      active,
      charging,
      offline,
      totalChange,
      activeChange,
      chargingChange,
      offlineChange
    };
  };
  
  const stats = calculateStats();
  
  if (autoLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const statCards = [
    {
      title: "Total Mowers",
      value: stats.total,
      icon: Tractor,
      iconColor: "text-primary",
      iconBg: "bg-primary/20",
      change: stats.totalChange,
      changeText: "Since last month"
    },
    {
      title: "Active Mowers",
      value: stats.active,
      icon: Play,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/20",
      change: stats.activeChange,
      changeText: "Since yesterday"
    },
    {
      title: "Charging",
      value: stats.charging,
      icon: Zap,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/20",
      change: stats.chargingChange,
      changeText: "Since yesterday"
    },
    {
      title: "Offline",
      value: stats.offline,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/20",
      change: stats.offlineChange,
      changeText: "Since yesterday"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <Card key={index} className="border border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground font-medium">{card.title}</h3>
              <span className={`p-2 ${card.iconBg} rounded-full ${card.iconColor}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {card.change !== undefined && card.change !== 0 && (
                <span className={`flex items-center ${(card.change || 0) > 0 ? 'text-green-500' : 'text-red-500'} mr-2`}>
                  {(card.change || 0) > 0 ? (
                    <>
                      <ArrowUp className="mr-1 h-3 w-3" /> {card.change}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="mr-1 h-3 w-3" /> {Math.abs(card.change || 0)}
                    </>
                  )}
                </span>
              )}
              <span>{card.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
