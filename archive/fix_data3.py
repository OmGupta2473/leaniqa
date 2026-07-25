import re

with open("src/features/nutrition/constants/data.ts", "r") as f:
    content = f.read()

lookup_pattern = r'  const quantity = extracted\?.quantity \?\? 1;.*?if \(MealMacroCache\[searchKey\]\) \{.*?const result = scaleMacros\(MealMacroCache\[searchKey\], quantity, extracted\?.unit\);.*?return result; // Can be null if unit mismatch.*?\}'

new_lookup = """  const quantity = extracted?.quantity ?? 1;

  if (MealMacroCache[searchKey]) {
    const macros = MealMacroCache[searchKey];
    const result = scaleMacros(macros, quantity, extracted?.unit);
    
    console.group('Cache Lookup Audit: ' + text);
    console.log('User Input:', text);
    console.log('Parsed Food:', searchKey);
    console.log('Parsed Quantity:', quantity);
    console.log('Parsed Unit:', extracted?.unit || 'count');
    console.log('Nutrition per Serving:', macros);
    console.log('Final Nutrition:', result);
    console.groupEnd();
    
    return result; // Can be null if unit mismatch
  }"""

content = re.sub(lookup_pattern, new_lookup, content, flags=re.DOTALL)

with open("src/features/nutrition/constants/data.ts", "w") as f:
    f.write(content)

