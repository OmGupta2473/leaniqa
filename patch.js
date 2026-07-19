const fs = require('fs');
const content = fs.readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

const targetStr = `      </div>px] italic">No meals logged for this day.</div>
      </div>`;

const newStr = `      </div>

      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
      <div style={{ height: '120px', flexShrink: 0 }} aria-hidden="true" />
      </div>`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content.replace(targetStr, newStr));
  console.log('patched');
} else {
  console.log('targetStr not found');
  console.log(content.slice(20000, 30000));
}
