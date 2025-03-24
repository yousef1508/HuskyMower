import { Link, useLocation } from "wouter";
import { LayoutDashboard, Tractor, CloudSun, Wrench, Calendar, FileText, UserCog, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mowers", label: "Mowers", icon: Tractor },
    { href: "/weather", label: "Weather", icon: CloudSun },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/settings", label: "Settings", icon: UserCog },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 overflow-y-auto bg-background">
      <nav className="space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-secondary/30 rounded-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Info className="h-5 w-5 text-primary" />
          <span className="font-medium">API Status</span>
        </div>
        <div className="text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Husqvarna API:</span>
            <span className="text-green-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div> Connected
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Weather API:</span>
            <span className="text-green-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div> Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
