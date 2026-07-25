import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

# Update streak lookup
content = content.replace(
    "  const calorieStreak = earnedAwards.find(a => a.category === 'calories')?.currentStreak || 0;\n  const proteinStreak = earnedAwards.find(a => a.category === 'protein')?.currentStreak || 0;",
    "  const currentStreak = earnedAwards.find(a => a.category === 'daily')?.currentStreak || 0;"
)

# Replace calAwards and proAwards
content = content.replace(
    '  const calAwards = earnedAwards.filter((a) => a.category === "calories");\n  const proAwards = earnedAwards.filter((a) => a.category === "protein");',
    '  const dailyAwards = earnedAwards.filter((a) => a.category === "daily");'
)

# Update the streak stats section
stats_old = r"""      <div className="mx-\[20px\] mb-\[24px\] p-\[16px\] bg-\[rgba\(255,255,255,0\.05\)\] border border-\[rgba\(255,255,255,0\.1\)\] rounded-\[16px\] flex justify-center">
        <div className="text-center py-\[14px\] pr-\[24px\]">
          <div
            style={{
              fontSize: "var\(--font-stat\)",
              color: "#D4FF00",
              fontWeight: 700,
            }}
          >
            \{calorieStreak\}
          </div>
          <div
            style={{
              fontSize: "var\(--font-xs\)",
              color: "rgba\(235,235,245,0\.5\)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Day Calorie Streak
          </div>
        </div>
        <div
          className="text-center py-\[14px\] pl-\[24px\]"
          style={{ borderLeft: "1px solid rgba\(255,255,255,0\.1\)" }}
        >
          <div
            style={{
              fontSize: "var\(--font-stat\)",
              color: "#FF4D1C",
              fontWeight: 700,
            }}
          >
            \{proteinStreak\}
          </div>
          <div
            style={{
              fontSize: "var\(--font-xs\)",
              color: "rgba\(235,235,245,0\.5\)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Day Protein Streak
          </div>
        </div>
      </div>"""

stats_new = """      <div className="mx-[20px] mb-[24px] p-[16px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[16px] flex justify-center">
        <div className="text-center py-[14px]">
          <div
            style={{
              fontSize: "var(--font-stat)",
              color: "#D4FF00",
              fontWeight: 700,
            }}
          >
            {currentStreak}
          </div>
          <div
            style={{
              fontSize: "var(--font-xs)",
              color: "rgba(235,235,245,0.5)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Day Daily Streak
          </div>
        </div>
      </div>"""

content = re.sub(r'      <div className="mx-\[20px\].*?Day Protein Streak\s*</div>\s*</div>\s*</div>', stats_new, content, flags=re.DOTALL)


# Now update the sections
section_old = r"""      <div className="px-\[20px\] pb-\[40px\]">
        <h2 style={{ fontSize: 'var\(--font-md\)', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Calorie Control</h2>
        <div className="grid grid-cols-2 gap-\[12px\]">
          \{calAwards\.map\(\(aw\) => \(
            <div key=\{aw\.id\} className="award-tile" onClick=\{.*?aw\)\}>
              <div className="award-tile-bg"></div>
              \{renderBadge\(aw, 56, aw\.earned || false, false\)\}
              <div className="award-tile-name" style={{ color: aw\.earned \? 'white' : 'rgba\(235,235,245,0\.3\)' }}>\{aw\.name\}</div>
            </div>
          \)\)\}
        </div>
      </div>

      <div className="px-\[20px\] pb-\[40px\]">
        <h2 style={{ fontSize: 'var\(--font-md\)', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Protein Consistency</h2>
        <div className="grid grid-cols-2 gap-\[12px\]">
          \{proAwards\.map\(\(aw\) => \(
            <div key=\{aw\.id\} className="award-tile" onClick=\{.*?aw\)\}>
              <div className="award-tile-bg"></div>
              \{renderBadge\(aw, 56, aw\.earned || false, false\)\}
              <div className="award-tile-name" style={{ color: aw\.earned \? 'white' : 'rgba\(235,235,245,0\.3\)' }}>\{aw\.name\}</div>
            </div>
          \)\)\}
        </div>
      </div>"""

section_new = """      <div className="px-[20px] pb-[40px]">
        <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Daily Streaks</h2>
        <div className="grid grid-cols-2 gap-[12px]">
          {dailyAwards.map((aw) => (
            <div key={aw.id} className="award-tile" onClick={() => setSelectedAward(aw)}>
              <div className="award-tile-bg"></div>
              {renderBadge(aw, 56, aw.earned || false, false)}
              <div className="award-tile-name" style={{ color: aw.earned ? 'white' : 'rgba(235,235,245,0.3)' }}>{aw.name}</div>
            </div>
          ))}
        </div>
      </div>"""

content = re.sub(r'      <div className="px-\[20px\] pb-\[40px\]">\s*<h2 style=\{\{ fontSize: \'var\(--font-md\)\', fontWeight: 700, color: \'white\', marginBottom: \'16px\' \}\}>Calorie Control.*?</div>\s*</div>', section_new, content, flags=re.DOTALL)


with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
