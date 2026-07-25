const fs = require('fs');
const file = 'src/features/nutrition/pages/MealLoggerPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="meal-modal-content floating-mobile"/g, '');
content = content.replace(/className="meal-modal-content"/g, '');

content = content.replace(/style=\{\{\s*width: '100%',\s*maxWidth: '480px',\s*margin: '0 auto',\s*background: 'rgba\(22,22,24,0\.99\)',\s*backdropFilter: 'blur\(12px\)',\s*WebkitBackdropFilter: 'blur\(12px\)',\s*borderRadius: '24px',\s*border: '0\.5px solid rgba\(255,255,255,0\.12\)',\s*paddingBottom: '16px',\s*marginBottom: `calc\\(env\\(safe-area-inset-bottom\\) \+ 110px \+ \$\{keyboardOffset\}px\\)`,\s*maxHeight: 'calc\\(100dvh - 130px\\)',\s*display: 'flex',\s*flexDirection: 'column',\s*boxShadow: '0 10px 40px rgba\(0,0,0,0\.5\)',\s*\}\}/g, `className="meal-modal-content"\n              style={{\n                marginBottom: isKeyboardOpen ? \`\${keyboardOffset + 16}px\` : undefined,\n                paddingBottom: '16px'\n              }}`);

fs.writeFileSync(file, content);
