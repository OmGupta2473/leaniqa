import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

old_opt = """      queryClient.setQueryData(['weightLogs'], (old: any) => {
        if (!old) return [newLog];
        return [...old, newLog];
      });"""

new_opt = """      queryClient.setQueryData(['weightLogs'], (old: any) => {
        if (!old) return [newLog];
        
        // Find if an entry for today already exists
        const todayPrefix = newLog.date.substring(0, 10);
        const existingIndex = old.findIndex((l: any) => l.date.startsWith(todayPrefix));
        
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = { ...updated[existingIndex], weight: val };
          return updated;
        }
        
        return [...old, newLog];
      });"""

content = content.replace(old_opt, new_opt)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
