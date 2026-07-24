import React, { Profiler } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  FileBarChart,
  Plus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/shared/utils/haptics";

const navItems = [
  { id: "/goal", icon: Target, label: "Goal" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: Plus, label: "Log" },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/reports", icon: FileBarChart, label: "Reports" },
];

export function BottomNav() {
  useRenderTracker('BottomNav');
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <Profiler id="BottomNav" onRender={onRenderCallback}>
      <div className="w-full flex justify-center pb-[calc(20px+env(safe-area-inset-bottom))] px-5 pointer-events-none fixed bottom-0 z-50">
        <div 
          className="flex items-center justify-between px-2 py-2 w-full max-w-[400px] pointer-events-auto rounded-[28px]"
          style={{
            background: "rgba(18, 18, 20, 0.75)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "0.5px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.id}
              onClick={(e) => {
                if (!hasCompletedOnboarding) {
                  e.preventDefault();
                } else {
                  haptics.tap();
                }
              }}
              className="relative flex items-center justify-center h-[46px] rounded-full outline-none"
              style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              {({ isActive }) => {
                const isItemDisabled = !hasCompletedOnboarding;
                const activeColor = "#D4FF00";
                const inactiveColor = "rgba(255, 255, 255, 0.4)";
                const color = isItemDisabled 
                  ? "rgba(255,255,255,0.15)" 
                  : (isActive ? activeColor : inactiveColor);

                return (
                  <motion.div 
                    layout
                    whileTap={{ scale: isActive ? 1 : 0.9 }}
                    className={`flex items-center justify-center px-3.5 h-full rounded-full relative z-10 ${isItemDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isActive && !isItemDisabled && (
                      <motion.div
                        layoutId="activeGlassCapsule"
                        className="absolute inset-0 rounded-full z-[-1]"
                        style={{
                          background: "rgba(30, 36, 10, 0.6)",
                          backdropFilter: "blur(12px)",
                          border: "0.5px solid rgba(212, 255, 0, 0.15)",
                          boxShadow: "0 4px 12px rgba(212, 255, 0, 0.05), inset 0 1px 0 rgba(212, 255, 0, 0.1)",
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 350, 
                          damping: 30,
                          mass: 0.8
                        }}
                      />
                    )}
                    
                    <motion.div layout className="flex items-center justify-center">
                      <item.icon 
                        size={22} 
                        strokeWidth={isActive && !isItemDisabled ? 2.5 : 2}
                        style={{
                          color: color,
                          transform: isActive && !isItemDisabled ? "scale(1.1) translateY(-1px)" : "scale(1) translateY(0)",
                          transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }}
                      />
                    </motion.div>
                    
                    <AnimatePresence>
                      {isActive && !isItemDisabled && (
                        <motion.span 
                          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                          animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="overflow-hidden whitespace-nowrap tracking-wide"
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: activeColor,
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }}
            </NavLink>
          ))}
        </div>
      </div>
    </Profiler>
  );
}