const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(/\.meal-modal-content\.floating-mobile/g, '.meal-modal-content');
content = content.replace(/margin-bottom: calc\(env\(safe-area-inset-bottom\) \+ 80px\);/g, 'margin-bottom: calc(env(safe-area-inset-bottom) + 90px);\n    padding-bottom: 16px;');

fs.writeFileSync('src/index.css', content);
