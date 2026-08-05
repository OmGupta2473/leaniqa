import re

with open("server.ts", "r") as f:
    content = f.read()

# Let's separate it conceptually
old_kb_func = """function checkKnowledgeBase(normalizedText: string) {"""
new_kb_func = """// Phase 4: Knowledge Engine - Data is in KnowledgeBase
// Phase 5: Rule Engine - Deterministic calculations based on known nutrition
function applyRuleEngine(normalizedText: string) {"""

content = content.replace(old_kb_func, new_kb_func)

old_call = """      // Stage 2: Knowledge Engine
      const kbResult = checkKnowledgeBase(normalizedText);
      if (kbResult) {
        console.log(`[Orchestrator] Solved by KnowledgeBase`);
        return res.json({ ...kbResult, source: 'knowledge_base' });
      }

      // Stage 3: Rule Engine (Fallback Regex Matching for simple items with calories)"""

new_call = """      // Phase 4 & 5: Knowledge Engine + Rule Engine
      const ruleResult1 = applyRuleEngine(normalizedText);
      if (ruleResult1) {
        console.log(`[Orchestrator] Solved by Rule Engine (KB + Multiplier)`);
        return res.json({ ...ruleResult1, source: 'rule_engine' });
      }

      // Stage 3: Rule Engine (Fallback Regex Matching for simple items with calories)"""

content = content.replace(old_call, new_call)

with open("server.ts", "w") as f:
    f.write(content)
