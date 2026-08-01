import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

# Let's clean up the malformed React syntax
# The goal is to make it valid TSX again.
pattern = r"\) : \(\<div className=\"space-y-4\"\>.*?\</form\>\)\}"

old_section = content[content.find(") : (<div className=\"space-y-4\">"):content.find("</form>)}") + len("</form>)}")]

fixed_section = old_section.replace(") : (<div", ") : (\n<> <div")
fixed_section = fixed_section.replace("</form>)}", "</form>\n</>)} ")

content = content.replace(old_section, fixed_section)

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)

print("Updated AuthPage.tsx")
