import re

with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

if "import { useCallback } from 'react';" not in content and "useCallback" not in content:
    content = content.replace("import { memo } from 'react';", "import { memo, useCallback } from 'react';")

old_nav = """  const navItems = [
    { id: "/goal", icon: Target, label: "Goal Setter" },
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "/meals", icon: MessageSquare, label: "Meals", dot: true },
    { id: "/progress", icon: TrendingUp, label: "Progress" },
    { id: "/activity", icon: FileBarChart, label: "Activity" },
  ];"""

new_nav = """const navItems = [
  { id: "/goal", icon: Target, label: "Goal Setter" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Meals", dot: true },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];"""

# we need to put new_nav outside the component
content = content.replace(old_nav, "")
content = content.replace("export const Sidebar = memo(function Sidebar", new_nav + "\nexport const Sidebar = memo(function Sidebar")

old_logout = """  const handleLogout = async () => {    
    clearUserStore();
    queryClient.clear();
    await supabase.auth.signOut();
  };"""

new_logout = """  const handleLogout = useCallback(async () => {    
    clearUserStore();
    queryClient.clear();
    await supabase.auth.signOut();
  }, [clearUserStore, queryClient]);"""

content = content.replace(old_logout, new_logout)

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)
