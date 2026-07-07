import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    content = f.read()

# Remove the edit button
edit_btn_pattern = r"          <button onClick=\{openEdit\}.*?>\s*✎ Edit\s*</button>"
content = re.sub(edit_btn_pattern, "", content, flags=re.DOTALL)

# Remove the edit modal
edit_modal_pattern = r"\s*\{\/\* ── PROFILE EDIT MODAL ── \*\/\}\s*\{editOpen && \(.*?\)\}\s*</div>\s*\);\n\}"
content = re.sub(edit_modal_pattern, "\n    </div>\n  );\n}", content, flags=re.DOTALL)

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(content)
