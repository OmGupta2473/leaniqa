import re

with open("src/features/awards/services/awardService.ts", "r") as f:
    content = f.read()

content = content.replace(
"""    if (streakError) {
      console.error('Error syncing user_streaks:', streakError);
    }""",
"""    if (streakError) {
      if (!streakError.message?.includes('404') && streakError.code !== 'PGRST116' && !streakError.code?.startsWith('PGRST20')) {
        console.error('Error syncing user_streaks:', streakError);
      }
    }""")

content = content.replace(
"""      if (awardsError) {
        console.error('Error inserting user_awards:', awardsError);
      }""",
"""      if (awardsError) {
        if (!awardsError.message?.includes('404') && awardsError.code !== 'PGRST116' && !awardsError.code?.startsWith('PGRST20')) {
          console.error('Error inserting user_awards:', awardsError);
        }
      }""")

with open("src/features/awards/services/awardService.ts", "w") as f:
    f.write(content)
