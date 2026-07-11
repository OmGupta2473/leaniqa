import { authService } from '@/features/auth/services/authService';
import { useCallback } from 'react';
import { useUserStore } from "@/features/profile/store/userStore";
import { useAppStore } from "@/app/store";
import { cn } from "@/shared/utils/utils";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  FileBarChart,
  CreditCard,
  LogOut,
  Target,
  User,
} from "lucide-react";
import { supabase } from "@/shared/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { id: "/goal", icon: Target, label: "Goal Setter" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Meals", dot: true },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export function Sidebar({ className }: { className?: string }) {
  const clearUserStore = useUserStore(s => s.clearUserStore);
  
  const queryClient = useQueryClient();
  const handleLogout = async () => {
    
    clearUserStore();
    queryClient.clear();
    await authService.logout();
  };

  const { hasCompletedOnboarding } = useHasCompletedOnboarding();

  return (
    <div 
      className={cn("flex flex-col h-full w-full overflow-hidden", className)}
      style={{
        background: 'var(--color-bg-raised)',
        borderRight: '0.5px solid rgba(255,255,255,0.06)'
      }}
    >
      <div 
        className="flex items-center gap-3"
        style={{
          padding: '20px',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)'
        }}
      >
        <div 
          className="flex items-center justify-center font-bold text-black"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#D4FF00',
            fontSize: '16px'
          }}
        >
          L
        </div>
        <span 
          className="font-semibold"
          style={{
            fontSize: '18px',
            letterSpacing: '-0.4px',
            color: 'rgba(255,255,255,0.92)'
          }}
        >
          LeanIQa
        </span>
      </div>

      <div className="flex flex-col gap-1 p-2 flex-1">
        <div className="overline px-5 pt-3 pb-1">Menu</div>
        
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.id}
            onClick={(e) => {
              if (!hasCompletedOnboarding) {
                e.preventDefault();
              }
            }}
            title={item.label}
            aria-label={item.label}
            className="group relative"
            style={{ textDecoration: 'none', display: 'flex' }}
          >
            {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              return (
                <div 
                  className={cn(
                    "flex items-center gap-3 w-full transition-all duration-150 ease-in-out cursor-pointer",
                    isItemDisabled && "cursor-not-allowed opacity-50"
                  )}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    margin: '2px 8px',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderLeft: isActive ? '2px solid #D4FF00' : '2px solid transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isItemDisabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <item.icon size={20} strokeWidth={2} className="shrink-0" />
                  <span className="text-[14px] font-medium">{item.label}</span>
                  {item.dot && (
                    <span 
                      className="w-[6px] h-[6px] rounded-full absolute right-4"
                      style={{ background: '#D4FF00' }}
                    />
                  )}
                </div>
              );
            }}
          </NavLink>
        ))}

        <div className="flex-1" />
        <div className="overline px-5 pt-3 pb-1">Account</div>

        <NavLink
          to="/profile"
          onClick={(e) => {
            if (!hasCompletedOnboarding) {
              e.preventDefault();
            }
          }}
          title="Profile"
          aria-label="Profile"
          className="group relative"
          style={{ textDecoration: 'none', display: 'flex' }}
        >
          {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              return (
                <div 
                  className={cn(
                    "flex items-center gap-3 w-full transition-all duration-150 ease-in-out cursor-pointer",
                    isItemDisabled && "cursor-not-allowed opacity-50"
                  )}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    margin: '2px 8px',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderLeft: isActive ? '2px solid #D4FF00' : '2px solid transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isItemDisabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <User size={20} strokeWidth={2} className="shrink-0" />
                  <span className="text-[14px] font-medium">Profile</span>
                </div>
              );
          }}
        </NavLink>

        <NavLink
          to="/pricing"
          onClick={(e) => {
            if (!hasCompletedOnboarding) {
              e.preventDefault();
            }
          }}
          title="Plans"
          aria-label="Plans"
          className="group relative"
          style={{ textDecoration: 'none', display: 'flex' }}
        >
          {({ isActive }) => {
              const isItemDisabled = !hasCompletedOnboarding;
              return (
                <div 
                  className={cn(
                    "flex items-center gap-3 w-full transition-all duration-150 ease-in-out cursor-pointer",
                    isItemDisabled && "cursor-not-allowed opacity-50"
                  )}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    margin: '2px 8px',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderLeft: isActive ? '2px solid #D4FF00' : '2px solid transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isItemDisabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <CreditCard size={20} strokeWidth={2} className="shrink-0" />
                  <span className="text-[14px] font-medium">Plans</span>
                </div>
              );
          }}
        </NavLink>

        <button
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="group relative border-none bg-transparent"
          style={{ display: 'flex' }}
        >
          <div 
            className="flex items-center gap-3 w-full transition-all duration-150 ease-in-out cursor-pointer"
            style={{
              height: '40px',
              padding: '0 12px',
              borderRadius: '10px',
              margin: '2px 8px',
              borderLeft: '2px solid transparent',
              color: 'rgba(255,255,255,0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#FF4D1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <LogOut size={20} strokeWidth={2} className="shrink-0" />
            <span className="text-[14px] font-medium">Logout</span>
          </div>
        </button>
      </div>
    </div>
  );
}
