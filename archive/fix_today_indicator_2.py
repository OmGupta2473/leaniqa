import re

for filepath in ["src/features/nutrition/pages/CalorieDetailPage.tsx", "src/features/nutrition/pages/ProteinDetailPage.tsx"]:
    with open(filepath, "r") as f:
        content = f.read()

    # The end of the file looks like:
    #             </span>
    #           </div>
    #         </div>
    #       </div>
    #     </div>
    #   );
    # }

    legend_html = """
        <div style={{ fontSize: "11px", color: "rgba(235,235,245,0.5)", fontStyle: "italic", marginLeft: "4px", marginTop: "-16px", marginBottom: "32px" }}>
          * Still in calculation. Today's result will be finalized at the end of the day.
        </div>
      </div>
    </div>
  );
}"""

    content = re.sub(r'\s*</div>\s*</div>\s*</div>\s*\);\s*\}', '\n        </div>\n' + legend_html, content)

    with open(filepath, "w") as f:
        f.write(content)
