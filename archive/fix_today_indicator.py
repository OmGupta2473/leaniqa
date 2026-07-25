import re

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "r") as f:
    content = f.read()

# Edit the text for isUnderTarget
content = content.replace('{isUnderTarget ? "Under target ✓" : "Over target ✗"}', '{isUnderTarget ? "Under target ✓*" : "Over target ✗*"}')

# Add the legend below the bar chart container
legend_html = """
        <div style={{ fontSize: "11px", color: "rgba(235,235,245,0.5)", fontStyle: "italic", marginLeft: "4px", marginTop: "-16px", marginBottom: "32px" }}>
          * Still in calculation. Today's result will be finalized at the end of the day.
        </div>
      </div>
    </div>
  );
}"""

content = re.sub(r'          </div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\);\s*\}', '          </div>\n        </div>\n' + legend_html, content)

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "w") as f:
    f.write(content)


# Protein
with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "r") as f:
    content = f.read()

# The prompt: "Missed Target ✗* (Protein, if currently below target)"
content = content.replace('{isTargetHit ? "Target hit ✓" : "Missed target ✗"}', '{isTargetHit ? "Target hit ✓" : "Missed target ✗*"}')

content = re.sub(r'          </div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\);\s*\}', '          </div>\n        </div>\n' + legend_html, content)


with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "w") as f:
    f.write(content)
