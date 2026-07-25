import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# 1. Imports
if "ChevronLeft" not in content:
    content = content.replace("Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon, Plus, X,", "Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon, Plus, X, ChevronLeft, ChevronRight,")

# 2. State and selectedDate helpers
helpers = """  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  };

  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dateKeyStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  const getMealTime = () => {
    const d = new Date(selectedDate);
    const now = new Date();
    d.setHours(now.getHours());
    d.setMinutes(now.getMinutes());
    d.setSeconds(now.getSeconds());
    return d;
  };
"""
content = content.replace("  const selectedMealSlot = useNutritionStore(s => s.selectedMealSlot);", helpers + "\n  const selectedMealSlot = useNutritionStore(s => s.selectedMealSlot);")

# 3. Modify useQuery
old_query = """const { data: meals = [] } = useQuery({ queryKey: ["meals", "today"], queryFn: () => mealService.getTodaysMeals() });"""
new_query = """const { data: meals = [] } = useQuery({ queryKey: ["meals", "date", dateKeyStr], queryFn: () => mealService.getMealsForDate(selectedDate) });"""
content = content.replace(old_query, new_query)

# 4. Modify deleteMealMutation's keys
content = content.replace('queryKey: ["meals", "today"]', 'queryKey: ["meals", "date", dateKeyStr]')
content = content.replace('queryClient.getQueryData<any[]>(["meals", "today"])', 'queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr])')
content = content.replace('queryClient.getQueryData(["meals", "today"])', 'queryClient.getQueryData(["meals", "date", dateKeyStr])')
content = content.replace('queryClient.setQueryData(["meals", "today"]', 'queryClient.setQueryData(["meals", "date", dateKeyStr]')
content = content.replace('queryClient.invalidateQueries({ queryKey: ["meals", "today"] })', 'queryClient.invalidateQueries({ queryKey: ["meals", "date", dateKeyStr] })')

# 5. Modify new Date().toISOString() to getMealTime().toISOString() in addMealMutation
# Be careful to only replace inside addMealMutation
# We can just replace all occurrences because they are all in addMealMutation inside MealLoggerPage
content = content.replace("new Date().toISOString()", "getMealTime().toISOString()")

# 6. Replace header
old_header = """      {/* ── PAGE HEADER ── */}
      <div className="mb-[20px]">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Today's Meals</h2>
        <div className="text-[13px] text-[rgba(235,235,245,0.5)] mt-[2px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>"""

new_header = """      {/* ── PAGE HEADER ── */}
      <div className="mb-[20px] flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Meal Log</h2>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)] mt-[2px]">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-[14px] font-medium text-white min-w-[80px] text-center">
            {formatDateLabel(selectedDate)}
          </span>
          <button 
            onClick={() => {
              if (isToday(selectedDate)) return;
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d);
            }}
            disabled={isToday(selectedDate)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isToday(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer"
            )}
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      </div>"""

if old_header in content:
    content = content.replace(old_header, new_header)
else:
    # Just print warning if not matched exactly
    print("Warning: old header not found")

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
