import { readFileSync, writeFileSync } from 'fs';

const file = 'src/main.tsx';
let code = readFileSync(file, 'utf8');

const target = `migrateLocalStorage();`;
const replacement = `migrateLocalStorage();

// Unregister existing service workers to ensure updates are applied
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
`;

code = code.replace(target, replacement);
writeFileSync(file, code);
