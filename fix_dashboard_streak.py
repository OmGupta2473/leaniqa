import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

# Replace the streak-row mb-[16px] section
streak_row_pattern = r'      \{\/\* Streak chips \*\/.*?      </div>\n      </div>'

new_streak_row = """      {/* Streak chips */}
      <div className="streak-row mb-[16px]">
        <div className={`streak-chip ${currentStreak >= 7 ? 'hot' : ''}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '16px' }}>
          <span style={{ fontSize: '32px', marginRight: '12px' }}>{currentStreak > 0 ? '🔥' : '❄️'}</span>
          <div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: currentStreak > 0 ? '#D4FF00' : 'rgba(235,235,245,0.4)', lineHeight: 1 }}>
              {currentStreak > 0 ? currentStreak : '—'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>
              daily streak
            </div>
          </div>
        </div>
      </div>"""

content = re.sub(streak_row_pattern, new_streak_row, content, flags=re.DOTALL)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
