async function runTests() {
  const tests = [
    { text: "kadhai paneer with 2 butter naan", type: "dinner" },
    { text: "fjadsklfjadslfjsdal", type: "snack" }
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
      if (res.ok) {
        console.log(`Calories: ${data.calories}`);
        console.log(`Confidence: ${data.confidence}`);
        console.log(`Needs Review: ${data.needs_review}`);
      } else {
        console.log(`Error: ${data.error}`);
      }
    } catch(e) {
      console.error(e.message);
    }
  }
}
runTests();
