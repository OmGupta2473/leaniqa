function displayVal(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') {
    if (isNaN(val)) return '—';
    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
    }
  }
  return val;
}
console.log(displayVal(56.45263157894736));
console.log(displayVal("Aggressive Cut"));
console.log(displayVal("Lightly Active"));
console.log(displayVal(100));
console.log(displayVal("10.55"));
