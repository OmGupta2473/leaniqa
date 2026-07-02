import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "/goal", icon: Target, label: "Goal" },
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true },
    { id: "/progress", icon: TrendingUp, label: "Progress" },
    { id: "/activity", icon: FileBarChart, label: "Activity" },
  ];

  return (
    <div className="flex justify-around items-center h-[60px] w-full">
      {navItems.map((item) => {
        const active = location.pathname === item.id;
        const color = item.primary ? "#D4FF00" : active ? "#D4FF00" : "rgba(235,235,245,0.4)";
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              width: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "8px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color,
            }}
          >
            <item.icon size={20} strokeWidth={2} />
            <span
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: active ? 600 : 500,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
