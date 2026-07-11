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
    <div className="w-full flex justify-center pb-[calc(16px+env(safe-area-inset-bottom))] px-4 pointer-events-none">
      <div 
        className="flex items-center justify-between px-1.5 py-1.5 rounded-full w-full max-w-[400px] pointer-events-auto shadow-2xl"
        style={{
          background: "rgba(22, 22, 24, 0.65)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "0.5px solid rgba(255,255,255,0.1)",
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
                : (isActive ? "#000000" : "rgba(255,255,255,0.5)");

              return (
                <motion.div 
                  whileTap={{ scale: 0.92 }}
                  className={\`flex flex-col items-center justify-center gap-[3px] py-[8px] w-full rounded-full relative z-10 \${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
                >
                  {isActive && !isItemDisabled && (
                    <motion.div
                      layoutId="bottomNavActiveIndicator"
                      className="absolute inset-0 bg-[#D4FF00] rounded-full z-[-1]"
                      initial={false}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        mass: 0.8
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
                      fontSize: "9px",
                      fontWeight: isActive && !isItemDisabled ? 700 : 500,
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
    </div>
  );
}
`
fs.writeFileSync('src/shared/components/BottomNav.tsx', content);
