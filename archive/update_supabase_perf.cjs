const fs = require('fs');
const content = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials — check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// PERF DEBUG
const customFetch = (url, options) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    console.log(\`[PERF SUPABASE REQUEST START] \${options.method || 'GET'} \${url}\`);
    return fetch(url, options).then(res => {
      const duration = performance.now() - start;
      console.log(\`[PERF SUPABASE REQUEST END] \${options.method || 'GET'} \${url} - \${duration.toFixed(2)}ms\`);
      return res;
    }).catch(err => {
      const duration = performance.now() - start;
      console.log(\`[PERF SUPABASE REQUEST ERROR] \${options.method || 'GET'} \${url} - \${duration.toFixed(2)}ms\`);
      throw err;
    });
  }
  return fetch(url, options);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch
  }
});
`
fs.writeFileSync('src/shared/utils/supabase.ts', content);
