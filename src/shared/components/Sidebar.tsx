import { useUserStore } from "@/features/profile";
import { useAppStore } from "@/app/store";
import { cn } from "@/shared/utils/utils";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  CreditCard,
  LogOut,
  Target,
  User,
} from "lucide-react";
import { supabase } from "@/shared/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";

export function Sidebar({ className }: { className?: string }) {
  const clearUserStore = useUserStore(s => s.clearUserStore);
  
  const queryClient = useQueryClient();

  const navItems = [
    { id: "/goal", icon: Target, label: "Goal Setter" },
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "/meals", icon: MessageSquare, label: "Meals", dot: true },
    { id: "/progress", icon: TrendingUp, label: "Progress" },
    { id: "/activity", icon: FileBarChart, label: "Activity" },
  ];

  const handleLogout = async () => {
    
    clearUserStore();
    queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden", className)}>
      <div className="sidebar-logo-area">
        <div className="sidebar-logo-icon bg-purple-bg flex items-center justify-center font-bold italic text-purple text-lg">
          L
        </div>
        <span className="sidebar-logo-text">LeanIQA</span>
      </div>
      <div className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.id}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) => cn(
              "cursor-pointer transition-all relative",
              isActive
                ? "bg-background-primary text-purple border-[0.5px] border-border-tertiary shadow-sm"
                : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
            )}
            style={{ textDecoration: 'none', display: 'flex' }}
          >
            <item.icon size={20} strokeWidth={2} className="shrink-0" />
            <span className="sidebar-label">{item.label}</span>
            {item.dot && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple absolute right-2 top-2"></span>
            )}
          </NavLink>
        ))}
        <div className="flex-1" />
        <NavLink
          to="/profile"
          title="Profile"
          aria-label="Profile"
          className={({ isActive }) => cn(
            "cursor-pointer transition-all relative",
            isActive
              ? "bg-background-primary text-purple border-[0.5px] border-border-tertiary shadow-sm"
              : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
          )}
          style={{ textDecoration: 'none', display: 'flex' }}
        >
          <User size={20} strokeWidth={2} className="shrink-0" />
          <span className="sidebar-label">Profile</span>
        </NavLink>
        <NavLink
          to="/pricing"
          title="Plans"
          aria-label="Plans"
          className={({ isActive }) => cn(
            "cursor-pointer transition-all relative",
            isActive
              ? "bg-background-primary text-purple border-[0.5px] border-border-tertiary shadow-sm"
              : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
          )}
          style={{ textDecoration: 'none', display: 'flex' }}
        >
          <CreditCard size={20} strokeWidth={2} className="shrink-0" />
          <span className="sidebar-label">Plans</span>
        </NavLink>
        <button
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="cursor-pointer text-text-secondary hover:bg-background-primary hover:text-coral transition-all mt-1"
          style={{ display: 'flex' }}
        >
          <LogOut size={20} strokeWidth={2} className="shrink-0" />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </div>
  );
}
