import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

# Replace the Calorie and Protein sections with just one section
section_pattern = r'      <div className="section-header">.*?Hit your daily protein target consistently\s*</div>\s*</div>\s*<div className="awards-grid">.*?</div>'

new_section = """      <div className="section-header">
        <div style={{ fontSize: "var(--font-lg)", fontWeight: 700, color: "white" }}>
          Daily Streaks
        </div>
        <div style={{ fontSize: "var(--font-sm)", color: "rgba(235,235,245,0.6)" }}>
          Hit both calorie and protein targets consistently
        </div>
      </div>
      <div className="awards-grid">
        {dailyAwards.map((award) => (
          <div
            key={award.id}
            className="award-cell"
            onClick={() => setSelectedAward(award)}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: renderBadge(award, 72, award.earned, false),
              }}
            />
            <div
              style={{
                fontSize: "var(--font-xs)",
                fontWeight: 600,
                color: award.earned ? "white" : "rgba(235,235,245,0.5)",
                textAlign: "center",
                lineHeight: 1.2,
                marginTop: "4px",
              }}
            >
              {award.name}
            </div>
          </div>
        ))}
      </div>"""

content = re.sub(r'      <div className="section-header">.*?</div>\s*</div>\s*<div className="awards-grid">.*?</div>', new_section, content, count=1, flags=re.DOTALL)
content = re.sub(r'      <div className="section-header">.*?</div>\s*</div>\s*<div className="awards-grid">.*?</div>', '', content, count=1, flags=re.DOTALL)


with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
