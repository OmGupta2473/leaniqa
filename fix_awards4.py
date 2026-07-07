import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()


new_sections = """      {/* Daily Awards */}
      <div className="mt-[32px] px-[20px] mb-[12px]">
        <h2
          style={{
            fontSize: "var(--font-xl)",
            fontWeight: 700,
            color: "white",
            margin: 0,
          }}
        >
          🏆 Daily Awards
        </h2>
        <div
          style={{
            fontSize: "14px",
            color: "rgba(235,235,245,0.5)",
            marginTop: "4px",
          }}
        >
          Hit your targets consistently to unlock
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
            <div
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(235,235,245,0.4)",
                textTransform: "capitalize",
                textAlign: "center",
              }}
            >
              {award.tier}
            </div>
            {!award.earned && (
              <i
                className="ti ti-lock"
                style={{
                  fontSize: "12px",
                  color: "rgba(235,235,245,0.35)",
                  marginTop: "2px",
                }}
              ></i>
            )}
          </div>
        ))}
      </div>"""

# Replace the Calories and Protein section with new_sections
content = re.sub(r'      \{\/\* Calories \*\/.*?</div>\s*</div>\s*<div style=\{\{ height: "40px" \}\}></div>', new_sections + '\n      <div style={{ height: "40px" }}></div>', content, flags=re.DOTALL)

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
