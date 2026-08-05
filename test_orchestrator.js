async function runTests() {
  const tests = [
    { text: "2 roti and 1 bowl dal", type: "lunch" },
    { text: "30g protein shake", type: "snack" },
    { text: "200 calories of chips", type: "snack" },
    { text: "150 g chicken breast", type: "lunch" },
    { text: "unknown magical food from future", type: "dinner" }
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
      console.log(`Protein: ${data.protein}`);
    } catch(e) {
      console.error(e.message);
    }
  }
}
runTests();
