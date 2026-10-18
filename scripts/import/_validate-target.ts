/**
 * Shared target validation for all Phase 6.2+ import/seed scripts.
 *
 * Prevents four failure modes:
 *   1. Running against production by accident.
 *   2. Using prod credentials in staging env vars (or vice versa).
 *   3. Running against the wrong project for the declared env.
 *   4. Same ref configured in both EXPECTED_STAGING_REF and EXPECTED_PROD_REF.
 *
 * Callers:
 *   - assertStagingTarget(url)     — same behavior as before, unchanged signature
 *   - assertProductionTarget(url)  — new, requires EXPECTED_PROD_REF
 *
 * Both enforce:
 *   - URL ref MUST equal the EXPECTED_*_REF for the declared env
 *   - .supabase/.temp/project-ref, if present, MUST match the same ref
 *   - Cross-guard: same ref MUST NOT be configured for both environments
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export function extractRefFromUrl(url: string): string | null {
  const m = url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(co|in)\/?$/i);
  return m ? m[1].toLowerCase() : null;
}

export function readLinkedRef(cwd: string = process.cwd()): string | null {
  const p = resolve(cwd, '.supabase/.temp/project-ref');
  if (!existsSync(p)) return null;
  try {
    return readFileSync(p, 'utf8').trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

export interface TargetCheckResult {
  url: string;
  ref: string;
  expected: string;
  linked: string | null;
  env: 'staging' | 'production';
}

function assertTargetByEnv(
  url: string | undefined,
  env: 'staging' | 'production',
): TargetCheckResult {
  const envUpper = env.toUpperCase();
  const expectedKey = env === 'staging' ? 'EXPECTED_STAGING_REF' : 'EXPECTED_PROD_REF';
  const urlKey = env === 'staging' ? 'STAGING_SUPABASE_URL' : 'PROD_SUPABASE_URL';

  if (!url) {
    throw new Error(`${urlKey} is not set. Refusing to run.`);
  }

  const expected = process.env[expectedKey]?.toLowerCase();
  if (!expected) {
    throw new Error(
      `${expectedKey} is not set. Set it to the ${env} project ref ` +
      `(the subdomain of your ${env} URL). Refusing to run.`,
    );
  }

  const ref = extractRefFromUrl(url);
  if (!ref) {
    throw new Error(`Could not parse a project ref from URL: ${url}`);
  }

  if (ref !== expected) {
    throw new Error(
      `URL project ref "${ref}" does not match ${expectedKey} "${expected}".\n` +
      `Refusing to write. If you intended to target ${env}, update ${expectedKey}. ` +
      `If you intended a different environment, use the appropriate entry point.`,
    );
  }

  // Cross-guard: refuse if the same ref is configured as the OTHER env.
  const otherKey = env === 'staging' ? 'EXPECTED_PROD_REF' : 'EXPECTED_STAGING_REF';
  const otherRef = process.env[otherKey]?.toLowerCase();
  if (otherRef && ref === otherRef) {
    throw new Error(
      `Refusing to proceed: URL ref "${ref}" matches BOTH ${expectedKey} and ${otherKey}.\n` +
      `This means the env vars are misconfigured. One of them must be wrong.`,
    );
  }

  const linked = readLinkedRef();
  if (linked && linked !== expected) {
    throw new Error(
      `Linked project ref "${linked}" does not match ${expectedKey} "${expected}".\n` +
      `Refusing to write. Your .supabase/.temp/project-ref points somewhere else. ` +
      `Run: npx supabase link --project-ref ${expected}`,
    );
  }

  return { url, ref, expected, linked, env };
}

export function assertStagingTarget(url: string | undefined): TargetCheckResult {
  return assertTargetByEnv(url, 'staging');
}

export function assertProductionTarget(url: string | undefined): TargetCheckResult {
  return assertTargetByEnv(url, 'production');
}