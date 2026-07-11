const fs = require('fs');
let content = fs.readFileSync('src/shared/hooks/useCalculatedProfile.ts', 'utf8');

content = content.replace('export function useCalculatedProfile() {', `export function useCalculatedProfile() {
  if (import.meta.env.DEV) console.time('[PERF] useCalculatedProfile');`);

content = content.replace('  return { profileData: mergedData, profile, goal, hasCompletedOnboarding, isLoading };\n}', `  if (import.meta.env.DEV) console.timeEnd('[PERF] useCalculatedProfile');\n  return { profileData: mergedData, profile, goal, hasCompletedOnboarding, isLoading };\n}`);

fs.writeFileSync('src/shared/hooks/useCalculatedProfile.ts', content);
