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
  { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div className="flex justify-around items-center h-[60px] w-full">
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
            const color = isItemDisabled ? "rgba(235,235,245,0.2)" : (item.primary ? "#D4FF00" : isActive ? "#D4FF00" : "rgba(235,235,245,0.4)");
            return {
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "8px 4px",
              background: "none",
              border: "none",
              cursor: isItemDisabled ? "not-allowed" : "pointer",
              color,
              textDecoration: "none",
              opacity: isItemDisabled ? 0.5 : 1
            };
          }}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} strokeWidth={2} />
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: isActive && hasCompletedOnboarding ? 600 : 500,
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
