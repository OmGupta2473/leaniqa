import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

content = content.replace("""    onSuccess: (data) => {
      analytics.trackEvent('Custom Meal Logged', { calories: data.calories });
      haptics.success();
      setModalOpen(false);
      clearOldChats();
      addChatMessage({ id: Date.now().toString(), text: `✓ Logged Custom Meal: ${data.meal_text}`, isUser: false });
    }""", """    onSuccess: (data) => {
      analytics.trackEvent('Custom Meal Logged', { calories: data.calories });
      haptics.success();
      setIsCustomMealModalOpen(false);
      addChatMessage({ role: 'ai', text: `✓ Logged Custom Meal: ${data.meal_text}` });
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    }""")

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

