import React from 'react';
import { PerfProfiler } from '@/shared/utils/perfDebug';
import {
  LayoutDashboard,
  TrendingUp,
  FileBarChart,
  Plus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/shared/utils/haptics";
import { preloadRoute } from '@/router/preload';

const navItems = [
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: Plus, label: "Log" },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/reports", icon: FileBarChart, label: "Reports" },
];

const pillItems = navItems.filter((item) => item.id !== "/meals");

export function BottomNav() {
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <PerfProfiler id="BottomNav">
      <nav
        aria-label="Bottom Navigation"
        className="w-full flex justify-center px-5 pointer-events-none fixed bottom-0 z-50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="flex items-center justify-between w-full max-w-[400px] pointer-events-auto">
          <div
            className="flex items-center gap-1 rounded-full px-2 py-2"
            style={{
              background: 'rgba(30, 30, 32, 0.6)',
              backdropFilter: 'blur(24px) saturate(180%) brightness(110%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(110%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {pillItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.id}
                onMouseEnter={() => preloadRoute(item.id)}
                onFocus={() => preloadRoute(item.id)}
                onTouchStart={() => preloadRoute(item.id)}
                aria-label={item.label}
                title={item.label}
                onClick={(e) => {
                  if (!hasCompletedOnboarding) {
                    e.preventDefault();
                  } else {
                    haptics.tap();
                  }
                }}
                className="relative flex items-center justify-center h-[46px] min-w-[46px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]"
                style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
              >
                {({ isActive }) => (
                  <span className="relative flex items-center justify-center">
                    {isActive && (
                      <motion.div
                        layoutId="bottomnav-indicator"
                        className="absolute inset-0 rounded-full bg-white/[0.08]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={`relative z-10 h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-500'}`}
                    />
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <motion.div whileTap={{ scale: 0.94 }}>
            <NavLink
              to="/meals"
              onMouseEnter={() => preloadRoute('/meals')}
              onFocus={() => preloadRoute('/meals')}
              onTouchStart={() => preloadRoute('/meals')}
              aria-label="Log"
              title="Log"
              onClick={(e) => {
                if (!hasCompletedOnboarding) {
                  e.preventDefault();
                } else {
                  haptics.tap();
                }
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]"
              style={{
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                background: 'rgba(30, 30, 32, 0.6)',
                backdropFilter: 'blur(24px) saturate(180%) brightness(110%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(110%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(212,255,0,0.15)',
              }}
            >
              <Plus className="h-6 w-6 text-[#D4FF00]" />
            </NavLink>
          </motion.div>
        </div>
      </nav>
    </PerfProfiler>
  );
}
