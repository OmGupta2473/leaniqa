const fs = require('fs');

const content = `import {
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
  { id: "/meals", icon: MessageSquare, label: "Log Meal" },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div className="w-full flex justify-center pb-[calc(16px+env(safe-area-inset-bottom))] px-4 pointer-events-none">
      <div 
        className="flex items-center justify-between px-2 py-2 rounded-[32px] w-full max-w-[400px] pointer-events-auto"
        style={{
          background: "rgba(28,28,30,0.85)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          border: "0.5px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
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
            className="flex-1 flex flex-col items-center justify-center relative"
            style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              
              const color = isItemDisabled 
                ? "rgba(255,255,255,0.2)" 
                : (isActive ? "#000000" : "rgba(255,255,255,0.45)");
                
              const bgColor = isActive && !isItemDisabled ? "#D4FF00" : "transparent";

              return (
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={\`flex flex-col items-center justify-center gap-[4px] py-[8px] px-[8px] rounded-[20px] w-[56px] \${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
                  style={{
                    backgroundColor: bgColor,
                    transition: "background-color 300ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <item.icon 
                    size={22} 
                    strokeWidth={isActive && !isItemDisabled ? 2.5 : 2}
                    style={{
                      color: color,
                      transition: "color 300ms cubic-bezier(0.4,0,0.2,1), stroke-width 300ms ease"
                    }}
                  />
                  <span 
                    className="tracking-tight"
                    style={{
                      fontSize: "9px",
                      fontWeight: isActive && !isItemDisabled ? 700 : 500,
                      color: color,
                      transition: "color 300ms cubic-bezier(0.4,0,0.2,1)"
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
    </div>
  );
}
`
fs.writeFileSync('src/shared/components/BottomNav.tsx', content);
