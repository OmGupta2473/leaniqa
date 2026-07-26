const maleOptions = [
  { range: 'Under 8%', mid: 5 },
  { range: '8–12%', mid: 10 },
  { range: '12–15%', mid: 13.5 },
  { range: '15–20%', mid: 17.5 },
  { range: '20–25%', mid: 22.5 },
  { range: '25–30%', mid: 27.5 },
  { range: '30–40%', mid: 35 },
  { range: 'Above 40%', mid: 45 }
];

console.log(maleOptions.findIndex(o => o.mid === 17.5));
