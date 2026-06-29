import { useAppStore } from "../store";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";

export function BottomNav() {
  const { currentScreen, setScreen } = useAppStore();

  const navItems = [
    { id: "goal", icon: Target, label: "Goal" },
    { id: "dash", icon: LayoutDashboard, label: "Dashboard" },
    { id: "meal", icon: MessageSquare, label: "Log Meal", primary: true },
    { id: "progress", icon: TrendingUp, label: "Progress" },
    { id: "week", icon: FileBarChart, label: "Reports" },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const active = currentScreen === item.id;
        const color = item.primary ? "#D4FF00" : active ? "#D4FF00" : "rgba(235,235,245,0.4)";
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
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
