export function isSafeNextPath(nextParam: string | null): nextParam is string {
  return nextParam !== null && /^\/(?:$|[^/\\])/.test(nextParam);
}
