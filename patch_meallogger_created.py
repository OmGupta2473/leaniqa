import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Add a helper for isAtOrBeforeCreatedAt
old_is_yesterday = """  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  };"""

new_helpers = """  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  };

  const isAtOrBeforeCreatedAt = (d: Date) => {
    if (!profile?.created_at) return false;
    const createdAt = new Date(profile.created_at);
    // compare only year, month, day
    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const cTime = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime();
    return dTime <= cTime;
  };
"""

content = content.replace(old_is_yesterday, new_helpers)

# Replace the left chevron button
old_button_left = """          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>"""

new_button_left = """          <button 
            onClick={() => {
              if (isAtOrBeforeCreatedAt(selectedDate)) return;
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            disabled={isAtOrBeforeCreatedAt(selectedDate)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isAtOrBeforeCreatedAt(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer"
            )}
            title={isAtOrBeforeCreatedAt(selectedDate) ? "This is your first day on LeanIQA. No meal history exists before this date." : "Previous Day"}
          >
            <ChevronLeft size={16} className="text-white" />
          </button>"""

content = content.replace(old_button_left, new_button_left)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
