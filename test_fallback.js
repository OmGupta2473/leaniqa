async function runTests() {
  const tests = [
    { text: "kadhai paneer with 2 butter naan", type: "dinner" }
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
      console.log(`Calories: ${data.calories}`);
      console.log(`Foods Detected: ${data.foods_detected.join(", ")}`);
    } catch(e) {
      console.error(e.message);
    }
  }
}
runTests();
