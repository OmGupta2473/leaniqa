import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

toggle_fn = """  const toggleHeightUnit = (unit: 'cm'|'ft') => {
    if (unit === heightUnit) return;
    if (unit === 'ft') {
      const cm = parseFloat(height);
      if (!isNaN(cm) && cm > 0) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());
      } else {
        setHeightFt('5');
        setHeightIn('8');
      }
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        const totalInches = (ft * 12) + inc;
        const cm = Math.round(totalInches * 2.54);
        setHeight(cm.toString());
      } else {
        setHeight('170');
      }
    }
    setHeightUnit(unit);
  };
"""

content = content.replace("  const getComputedHeight = () => {", toggle_fn + "\n  const getComputedHeight = () => {")

# update the buttons to use toggleHeightUnit
content = content.replace("onClick={() => setHeightUnit('cm')}", "onClick={() => toggleHeightUnit('cm')}")
content = content.replace("onClick={() => setHeightUnit('ft')}", "onClick={() => toggleHeightUnit('ft')}")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
