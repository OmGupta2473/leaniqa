const state = { a: 1 };
const overrides = { a: undefined, b: 2 };
const out = { ...state, ...overrides };
console.log(out);
