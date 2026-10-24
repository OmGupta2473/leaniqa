const REQUIRED_STAGING_REF = 'yvtoxpsmxlrljpuqvzgv';

export function assertStagingTarget(
  url: string | undefined,
  expectedRef: string | undefined,
): asserts url is string {
  if (expectedRef !== REQUIRED_STAGING_REF) {
    throw new Error(
      `Expected staging project ref must be ${REQUIRED_STAGING_REF}; got ${expectedRef ?? 'missing'}`,
    );
  }

  if (!url) {
    throw new Error('Supabase project ref mismatch: target URL is missing');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Supabase project ref mismatch: target URL is invalid');
  }

  const projectRef = parsedUrl.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)?.[1]
    ?.toLowerCase();
  if (
    parsedUrl.protocol !== 'https:'
    || projectRef !== REQUIRED_STAGING_REF
    || projectRef !== expectedRef
  ) {
    throw new Error(
      `Supabase project ref mismatch: expected ${REQUIRED_STAGING_REF} but got ${projectRef ?? parsedUrl.hostname}`,
    );
  }
}
