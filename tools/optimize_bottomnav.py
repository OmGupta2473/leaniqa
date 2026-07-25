import re

with open('src/shared/components/BottomNav.tsx', 'r') as f:
    content = f.read()

# We can move navItems outside.
old_nav = """export const BottomNav = memo(function BottomNav() {
  const navItems = [
    { id: "/goal", icon: Target, label: "Goal" },
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true },
    { id: "/progress", icon: TrendingUp, label: "Progress" },
    { id: "/activity", icon: FileBarChart, label: "Activity" },
  ];"""

new_nav = """const navItems = [
  { id: "/goal", icon: Target, label: "Goal" },
  { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "/meals", icon: MessageSquare, label: "Log Meal", primary: true },
  { id: "/progress", icon: TrendingUp, label: "Progress" },
  { id: "/activity", icon: FileBarChart, label: "Activity" },
];

export const BottomNav = memo(function BottomNav() {"""

content = content.replace(old_nav, new_nav)

with open('src/shared/components/BottomNav.tsx', 'w') as f:
    f.write(content)
