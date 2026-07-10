import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';

const navItems = [
  { id: "/goal", icon: Target, label: "Goal" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true }, // Unified with a clean Chat/Message icon
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[450px] flex justify-around items-center h-[72px] px-2 bg-[#1C1C1E]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.id}
          onClick={(e) => {
            if (!hasCompletedOnboarding) {
              e.preventDefault();
            }
          }}
          style={({ isActive }) => {
            const isItemDisabled = !hasCompletedOnboarding;
            const color = isItemDisabled 
              ? "rgba(235,235,245,0.2)" 
              : (item.primary ? "#D4FF00" : isActive ? "#D4FF00" : "rgba(235,235,245,0.4)");
              
            return {
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "8px 2px",
              background: "none",
              border: "none",
              cursor: isItemDisabled ? "not-allowed" : "pointer",
              color,
              textDecoration: "none",
              opacity: isItemDisabled ? 0.5 : 1,
              transition: "all 0.2s ease-in-out"
            };
          }}
        >
          {({ isActive }) => (
            <>
              {/* Primary action icon is slightly emphasized */}
              <item.icon 
                size={item.primary ? 24 : 21} 
                strokeWidth={isActive || item.primary ? 2.5 : 2} 
              />
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: isActive && hasCompletedOnboarding ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}