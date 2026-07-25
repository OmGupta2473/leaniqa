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
        className="flex items-center justify-between px-1.5 py-1.5 rounded-full w-full max-w-[420px] pointer-events-auto"
        style={{
          background: "rgba(28, 28, 30, 0.65)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "0.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
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
            className="flex-1 flex flex-col items-center justify-center relative h-[56px]"
            style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              
              const color = isItemDisabled 
                ? "rgba(255,255,255,0.2)" 
                : (isActive ? "#000000" : "rgba(255,255,255,0.55)");

              return (
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={\`flex flex-col items-center justify-center gap-1 w-full h-full rounded-full relative z-10 \${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
                >
                  {isActive && !isItemDisabled && (
                    <motion.div
                      layoutId="bottomNavActiveIndicatorPill"
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
                      transition: "color 250ms ease-out, stroke-width 250ms ease-out"
                    }}
                  />
                  <span 
                    className="tracking-tight"
                    style={{
                      fontSize: "10px",
                      fontWeight: isActive && !isItemDisabled ? 700 : 500,
                      color: color,
                      transition: "color 250ms ease-out"
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
