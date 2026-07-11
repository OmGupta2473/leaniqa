import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion, AnimatePresence } from "motion/react";

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
    <div 
      className="w-full flex justify-around items-center"
      style={{
        background: "rgba(10,10,11,0.88)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "calc(56px + env(safe-area-inset-bottom))",
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
          className="flex-1 h-full flex items-center justify-center pointer-events-auto"
          style={{ textDecoration: 'none' }}
        >
          {({ isActive }) => {
            const isItemDisabled = !hasCompletedOnboarding;
            const color = isItemDisabled 
              ? "rgba(255,255,255,0.2)" 
              : (isActive ? "#D4FF00" : "rgba(255,255,255,0.38)");
            
            return (
              <motion.div 
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center justify-center gap-[2px] py-[8px] px-[10px] rounded-[14px] ${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  transition: "background-color 250ms cubic-bezier(0.4,0,0.2,1)",
                  minWidth: "44px",
                  minHeight: "44px"
                }}
              >
                <item.icon 
                  size={22} 
                  strokeWidth={2}
                  style={{
                    color: color,
                    transition: "color 200ms ease"
                  }}
                />
                <span 
                  className="uppercase tracking-wide"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.05em",
                    color: color,
                    transition: "color 200ms ease"
                  }}
                >
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                <div className="h-[3px] flex items-center justify-center mt-[1px]">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "99px",
                          background: "#D4FF00"
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          }}
        </NavLink>
      ))}
    </div>
  );
}
