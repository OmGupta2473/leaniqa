const fs = require('fs');
let content = fs.readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

const targetStr = `            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.inv  return (`;

const newStr = `            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        ).catch(console.error)
      ]);
    },
  });

  const handleSend = React.useCallback(() => {
    if (import.meta.env.DEV) console.time('[PERF] MealLogger handleSend');
    const text = input.trim();
    if (!text || loading || !selectedMealSlot) return;
    setInput("");
    addChatMessage({ role: "user", text });
    setLoading(true);
    addMealMutation.mutate(text);
  }, [input, loading, selectedMealSlot, addChatMessage, addMealMutation]);

  return (`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content.replace(targetStr, newStr));
  console.log('patched');
} else {
  console.log('not found');
}
