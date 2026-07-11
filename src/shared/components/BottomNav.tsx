import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion } from "motion/react";

const navItems = [
  { id: "/goal", icon: Target, label: "Goal" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Log Meal" },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div 
      className="w-full flex justify-between items-center px-1 pt-1 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.3)]"
      style={{
        background: "rgba(22, 22, 24, 0.75)",
        backdropFilter: "blur(48px) saturate(200%)",
        WebkitBackdropFilter: "blur(48px) saturate(200%)",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        borderTopLeftRadius: "28px",
        borderTopRightRadius: "28px",
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.id}
          onClick={(e) => {
            if (!hasCompletedOnboarding) {
              e.preventDefault();
            }
          }}
          className="flex-1 flex flex-col items-center justify-center relative py-2"
          style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          {({ isActive }) => {
            const isItemDisabled = !hasCompletedOnboarding;
            
            const color = isItemDisabled 
              ? "rgba(255,255,255,0.2)" 
              : (isActive ? "#D4FF00" : "rgba(255,255,255,0.5)");

            return (
              <motion.div 
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center justify-center gap-1 w-[56px] h-[50px] relative z-10 ${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isActive && !isItemDisabled && (
                  <motion.div
                    layoutId="telegramActiveIndicator"
                    className="absolute inset-0 rounded-[20px] z-[-1]"
                    initial={false}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 35,
                      mass: 0.8
                    }}
                    style={{ 
                      background: "rgba(212, 255, 0, 0.12)",
                      border: "0.5px solid rgba(212, 255, 0, 0.2)"
                    }}
                  />
                )}
                
                <item.icon 
                  size={22} 
                  strokeWidth={isActive && !isItemDisabled ? 2.5 : 2.2}
                  style={{
                    color: color,
                    transition: "color 200ms ease-out, stroke-width 200ms ease-out"
                  }}
                />
                <span 
                  className="tracking-tight"
                  style={{
                    fontSize: "10px",
                    fontWeight: isActive && !isItemDisabled ? 600 : 500,
                    color: color,
                    transition: "color 200ms ease-out"
                  }}
                >
                  {item.label}
                </span>
              </motion.div>
            );
          }}
        </NavLink>
      ))}
    </div>
  );
}
