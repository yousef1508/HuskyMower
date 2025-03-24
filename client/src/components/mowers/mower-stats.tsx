import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Robot, Play, Zap, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

export default function MowerStats() {
  const { data: mowers, isLoading } = useQuery({
    queryKey: ["/api/mowers"],
    staleTime: 30000,
  });
  
  // Calculate stats based on mowers data
  const calculateStats = () => {
    if (!mowers || !Array.isArray(mowers)) {
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
    
    const total = mowers.length;
    const active = mowers.filter(m => m.status === 'MOWING').length;
    const charging = mowers.filter(m => m.status === 'CHARGING').length;
    const offline = mowers.filter(m => 
      m.status === 'OFF' || m.connectionStatus === 'disconnected'
    ).length;
    
    // Mock changes for now - in a real app this would come from historical data
    return {
      total,
      active,
      charging,
      offline,
      totalChange: 1,
      activeChange: 2,
      chargingChange: -1,
      offlineChange: 1
    };
  };
  
  const stats = calculateStats();
  
  if (isLoading) {
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
      icon: Robot,
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
      changeText: "Since yesterday",
      negative: true
    },
    {
      title: "Offline",
      value: stats.offline,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/20",
      change: stats.offlineChange,
      changeText: "Since yesterday",
      negative: false
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
              <span className={`flex items-center ${card.change > 0 ? 'text-green-500' : 'text-red-500'} mr-2`}>
                {card.change > 0 ? (
                  <>
                    <ArrowUp className="mr-1 h-3 w-3" /> {card.change}
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-1 h-3 w-3" /> {Math.abs(card.change)}
                  </>
                )}
              </span>
              <span>{card.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
