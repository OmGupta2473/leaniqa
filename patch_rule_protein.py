import re

with open("server.ts", "r") as f:
    content = f.read()

# Fix protein match issue
old_protein = r"""const proteinMatch = normalizedText.match(/^(\d+)\s*(?:g|gm|grams)\s*protein\s*(?:from|shake|powder)?\s*(.+)?$/i) ||
                           normalizedText.match(/^(.+?)\s*(?:with|has|contains)?\s*(\d+)\s*(?:g|gm|grams)\s*protein$/i);"""

new_protein = r"""const proteinMatch = normalizedText.match(/^(\d+)\s*(?:g|gm|grams)\s*protein\s*(?:from|shake|powder)?\s*(.+)?$/i) ||
                           normalizedText.match(/^(.+?)\s*(?:with|has|contains)?\s*(\d+)\s*(?:g|gm|grams)\s*protein$/i);"""

pattern = re.compile(re.escape(old_protein), re.DOTALL)
content = pattern.sub(lambda m: new_protein, content)

with open("server.ts", "w") as f:
    f.write(content)
