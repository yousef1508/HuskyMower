import { Link, useLocation } from "wouter";
import { LayoutDashboard, Tractor, CloudSun, Wrench, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mowers", label: "Mowers", icon: Tractor },
    { href: "/weather", label: "Weather", icon: CloudSun },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/more", label: "More", icon: Menu },
  ];

  return (
    <nav className="md:hidden flex justify-around items-center border-t border-border bg-background py-3">
      {menuItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center"
          >
            <Icon
              className={cn(
                "text-lg h-6 w-6",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
