import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { cn } from "@/shared/utils/utils";

const navItems = [
  { id: "/goal", icon: Target, label: "Goal" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div className="w-full flex justify-center pb-[calc(env(safe-area-inset-bottom,16px)+16px)] px-4 pointer-events-none">
      <div className="flex justify-around items-center h-[64px] w-full max-w-[420px] bg-[#1a1a1c]/90 backdrop-blur-xl border border-white/10 rounded-full px-2 shadow-2xl pointer-events-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.id}
            onClick={(e) => {
              if (!hasCompletedOnboarding) {
                e.preventDefault();
              }
            }}
            className="flex-1 flex justify-center items-center h-full bg-transparent border-none cursor-pointer transition-transform active:scale-95"
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              const color = isItemDisabled 
                ? "rgba(255,255,255,0.2)" 
                : (isActive || item.primary ? "#1a1a1c" : "rgba(255,255,255,0.6)");
              
              const bgColor = isItemDisabled
                ? "transparent"
                : (isActive || item.primary ? "#D4FF00" : "transparent");

              return (
                <div 
                  className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    isActive || item.primary ? "w-[56px] h-[40px] rounded-full" : "w-[40px] h-[40px] rounded-full"
                  )}
                  style={{ 
                    backgroundColor: bgColor,
                    color: color,
                    opacity: isItemDisabled ? 0.5 : 1
                  }}
                >
                  <item.icon size={20} strokeWidth={isActive || item.primary ? 2.5 : 2} />
                </div>
              );
            }}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
