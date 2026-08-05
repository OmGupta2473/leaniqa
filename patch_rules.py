import re

with open("server.ts", "r") as f:
    content = f.read()

# Add Rule Engine
old_engine_start = "// Stage 2/3: Knowledge Engine & Rule Engine"
old_engine_end = "console.log(`[Orchestrator] Needs AI for: \"${normalizedText}\"`);"

new_engine = """// Stage 2: Knowledge Engine
      const kbResult = checkKnowledgeBase(normalizedText);
      if (kbResult) {
        console.log(`[Orchestrator] Solved by KnowledgeBase`);
        return res.json({ ...kbResult, source: 'knowledge_base' });
      }

      // Stage 3: Rule Engine (Fallback Regex Matching for simple items with calories)
      // e.g. "200 calories of chips", "30g protein shake"
      let ruleResult = null;
      const calMatch = normalizedText.match(/^(\\d+)\\s*(?:kcal|calories?)\\s*(?:of|from)?\\s*(.+)$/i) || 
                       normalizedText.match(/^(.+?)\\s*(?:with|has|contains)?\\s*(\\d+)\\s*(?:kcal|calories?)$/i);
                       
      if (calMatch) {
        const cals = parseInt(calMatch[1] || calMatch[2], 10);
        const itemName = (calMatch[2] || calMatch[1]).trim();
        if (!isNaN(cals) && itemName) {
          ruleResult = {
            calories: cals,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            confidence: 90,
            foods_detected: [itemName],
            coaching_tip: `Quick log: ${cals} kcal from ${itemName}. Detailed macros (protein, carbs) aren't available for this entry.`
          };
        }
      }
      
      const proteinMatch = normalizedText.match(/^(\\d+)\\s*(?:g|gm|grams)\\s*protein\\s*(?:from|shake|powder)?\\s*(.+)?$/i) ||
                           normalizedText.match(/^(.+?)\\s*(?:with|has|contains)?\\s*(\\d+)\\s*(?:g|gm|grams)\\s*protein$/i);
                           
      if (!ruleResult && proteinMatch) {
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
      }

      if (ruleResult) {
        console.log(`[Orchestrator] Solved by RuleEngine`);
        return res.json({ ...ruleResult, source: 'rule_engine' });
      }

      console.log(`[Orchestrator] Needs AI for: "${normalizedText}"`);"""

pattern = re.compile(re.escape(old_engine_start) + r'.*?' + re.escape(old_engine_end), re.DOTALL)
content = pattern.sub(lambda m: new_engine, content)

with open("server.ts", "w") as f:
    f.write(content)
