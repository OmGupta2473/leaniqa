import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { LayoutDashboard, MessageSquare, TrendingUp, FileBarChart, CreditCard, LogOut, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function Sidebar() {
  const { currentScreen, setScreen, clearStore } = useAppStore();
  const queryClient = useQueryClient();

  const navItems = [
    { id: 'goal', icon: Target, label: 'Goal Setter' },
    { id: 'dash', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'meal', icon: MessageSquare, label: 'Meals', dot: true },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
    { id: 'week', icon: FileBarChart, label: 'Reports' },
  ];

  const handleLogout = async () => {
    clearStore();
    queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <nav className="w-16 bg-background-secondary border-r-[0.5px] border-border-tertiary flex flex-col items-center py-3 gap-1 shrink-0" role="navigation" aria-label="App navigation">
      <div className="w-10 h-10 mb-4 flex items-center justify-center font-bold italic text-purple text-xl">
        P
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setScreen(item.id)}
          title={item.label}
          aria-label={item.label}
          className={cn(
            "w-10 h-10 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-[18px] transition-all relative",
            currentScreen === item.id 
              ? "bg-background-primary text-purple border-[0.5px] border-border-tertiary shadow-sm" 
              : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
          )}
        >
          <item.icon size={20} strokeWidth={2} />
          {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-purple absolute right-1.5 top-1.5"></span>}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => setScreen('pricing')}
        title="Plans"
        aria-label="Plans"
        className={cn(
          "w-10 h-10 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-[18px] transition-all",
          currentScreen === 'pricing'
            ? "bg-background-primary text-purple border-[0.5px] border-border-tertiary shadow-sm" 
            : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
        )}
      >
        <CreditCard size={20} strokeWidth={2} />
      </button>
      <button
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout"
        className="w-10 h-10 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-secondary hover:bg-background-primary hover:text-coral transition-all mt-1"
      >
        <LogOut size={20} strokeWidth={2} />
      </button>
    </nav>
  );
}
