const QUALIFIER_TOKENS = new Set([
  'total',
  'each',
  'each one',
  'approximately',
  'approx',
  'half',
]);

export function isQualifierTerm(token: string): boolean {
  return QUALIFIER_TOKENS.has(token.trim().toLowerCase());
}

export function isQualifierOnly(unresolvedItems: ReadonlyArray<{ input_term: string }>): boolean {
  return unresolvedItems.length > 0 &&
    unresolvedItems.every(({ input_term }) => isQualifierTerm(input_term));
}
