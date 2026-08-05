import re

with open("server.ts", "r") as f:
    content = f.read()

old_protein_logic = r"""if (!ruleResult && proteinMatch) {
        const p = parseInt(proteinMatch[1] || proteinMatch[2], 10);
        const itemName = (proteinMatch[2] || proteinMatch[1] || "protein source").trim();
        if (!isNaN(p)) {
          ruleResult = {
            calories: p * 4, // Estimate 4 kcal per gram of pure protein
            protein: p,
            fat: 0,
            carbs: 0,
            fiber: 0,
            confidence: 85,
            foods_detected: [itemName],
            coaching_tip: `Quick log: ${p}g protein from ${itemName}.`
          };
        }
      }"""

new_protein_logic = r"""if (!ruleResult && proteinMatch) {
        const p = parseInt(proteinMatch[1] || proteinMatch[2], 10);
        let itemName = "protein source";
        if (proteinMatch[1] && proteinMatch[2]) itemName = proteinMatch[2]; // first regex, has item
        else if (proteinMatch[2] && proteinMatch[1]) itemName = proteinMatch[1]; // second regex, has item
        
        if (!isNaN(p)) {
          ruleResult = {
            calories: p * 4, // Estimate 4 kcal per gram of pure protein
            protein: p,
            fat: 0,
            carbs: 0,
            fiber: 0,
            confidence: 85,
            foods_detected: [itemName.trim()],
            coaching_tip: `Quick log: ${p}g protein from ${itemName.trim()}.`
          };
        }
      }"""

pattern = re.compile(re.escape(old_protein_logic), re.DOTALL)
content = pattern.sub(lambda m: new_protein_logic, content)

with open("server.ts", "w") as f:
    f.write(content)
