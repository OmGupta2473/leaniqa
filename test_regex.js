const msg = 'Failed to parse Groq JSON: { "calories": 24 * 4, "protein": 2.2 * 4, "fat": 2 * 4, "carbs": 1.1 * 4, "fiber": 1.5 * 4, "confidence": 100, "foods_detected": ["almonds"], "coaching_tip": "Consider adding high-protein foods like eggs, Greek yogurt, or whey protein to your breakfast to meet your daily protein target of 119g remaining." }';
const jsonStrMatch = msg.match(/\{[\s\S]*\}/);
let jsonStr = jsonStrMatch[0];
jsonStr = jsonStr.replace(/([0-9.]+)\s*\*\s*([0-9.]+)/g, (match, p1, p2) => String(parseFloat(p1) * parseFloat(p2)));
console.log(jsonStr);
console.log(JSON.parse(jsonStr));
