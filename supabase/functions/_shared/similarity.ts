/**
 * Bigram Dice similarity for the FDC fuzzy layer (Layer 3).
 *
 * Pure function, zero dependencies. Returns [0, 1].
 * Both inputs are expected to be normalized (lowercase, whitespace-collapsed).
 */
export function diceSimilarity(a: string, b: string): number {
  const bigrams = (s: string): Set<string> => {
    const out = new Set<string>();
    const t = ` ${s} `;
    for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}