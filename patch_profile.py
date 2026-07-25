import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

old_display = """function displayVal(val: any) {
  return val === undefined || val === null || isNaN(val) ? '—' : val;
}"""

new_display = """function displayVal(val: any) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') {
    if (isNaN(val)) return '—';
    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
    }
  }
  return val;
}"""

content = content.replace(old_display, new_display)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
