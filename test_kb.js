async function runTests() {
  const tests = [
    { text: "1 bowl curd", type: "snack" },
    { text: "2 pieces bread", type: "snack" },
    { text: "100g sprouts", type: "snack" },
    { text: "1 bowl chana", type: "lunch" },
    { text: "250ml milk and 1 apple", type: "breakfast" }
  ];

  for (const t of tests) {
    try {
      console.log(`\nTesting: "${t.text}"`);
      const res = await fetch('http://localhost:3000/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      });
      const data = await res.json();
      console.log(`Source: ${data.source}`);
      console.log(`Calories: ${data.calories}`);
      console.log(`Foods Detected: ${data.foods_detected.join(", ")}`);
    } catch(e) {
      console.error(e.message);
    }
  }
}
runTests();
