/**
 * Shared target validation for all Phase 6.2 import/seed scripts.
 *
 * Prevents three failure modes:
 *   1. Running against production by accident.
 *   2. Using prod credentials in staging env vars.
 *   3. Running against the wrong staging project.
 *
 * The check is: the URL's project ref MUST equal EXPECTED_STAGING_REF, AND
 * if .supabase/.temp/project-ref exists, it MUST also equal it. This gives
 * us two independent confirmations before any write happens.
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
}

export function assertStagingTarget(url: string | undefined): TargetCheckResult {
  if (!url) {
    throw new Error(
      'STAGING_SUPABASE_URL is not set. Add it to .env.local. Refusing to run.',
    );
  }

  const expected = process.env.EXPECTED_STAGING_REF?.toLowerCase();
  if (!expected) {
    throw new Error(
      'EXPECTED_STAGING_REF is not set. Set it to the staging project ref ' +
      '(the subdomain of your staging URL). Refusing to run.',
    );
  }

  const ref = extractRefFromUrl(url);
  if (!ref) {
    throw new Error(`Could not parse a project ref from URL: ${url}`);
  }

  if (ref !== expected) {
    throw new Error(
      `URL project ref "${ref}" does not match EXPECTED_STAGING_REF "${expected}".\n` +
      `Refusing to write. If you intended to target staging, update EXPECTED_STAGING_REF. ` +
      `If you intended to target production, you are in the wrong script — these are staging-only.`,
    );
  }

  const linked = readLinkedRef();
  if (linked && linked !== expected) {
    throw new Error(
      `Linked project ref "${linked}" does not match EXPECTED_STAGING_REF "${expected}".\n` +
      `Refusing to write. Your .supabase/.temp/project-ref points somewhere else. ` +
      `Run: npx supabase link --project-ref ${expected}`,
    );
  }

  return { url, ref, expected, linked };
}