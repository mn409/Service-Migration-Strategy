import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Activity, Target } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Main Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "User Explorer", icon: Users },
    { href: "/telemetry", label: "Telemetry & Events", icon: Activity },
    { href: "/strategy", label: "Migration Strategy", icon: Target },
  ];

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen overflow-y-auto print:hidden shrink-0">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold tracking-tight text-primary">MigrationOps</h2>
        <p className="text-xs text-muted-foreground">Cloud Service Deprecation</p>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-1 px-2">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}