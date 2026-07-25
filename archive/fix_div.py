with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

# Replace the specific block to add the closing div
target = """          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mt-[8px]">
            Score
          </div>
        </div>
      </div>"""

replacement = """          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mt-[8px]">
            Score
          </div>
        </div>
        </div>
      </div>"""

content = content.replace(target, replacement)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
