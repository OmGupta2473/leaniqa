import re

with open("server.ts", "r") as f:
    content = f.read()

old_func_start = "function normalizeInput(input: string): string {"
old_func_end = "  return s;\n}"

new_func = r"""function normalizeInput(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/[^a-z0-9\s\.]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  
  // Number words to digits
  const numWords: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'half': '0.5', 'a': '1', 'an': '1'
  };
  s = s.split(' ').map(word => numWords[word] || word).join(' ');

  s = s.replace(/(\d+)\s*(g|gm|gms|grams|gram)\b/g, '$1g');
  s = s.replace(/(\d+)\s*(ml|mls|milliliter|milliliters)\b/g, '$1ml');
  s = s.replace(/(\d+)\s*(pc|pcs|piece|pieces|pic)\b/g, '$1 piece');
  s = s.replace(/(\d+)\s*(bowl|bowls|katori|plate|plates)\b/g, '$1 bowl');
  s = s.replace(/(\d+)\s*(cup|cups)\b/g, '$1 cup');
  
  s = s.replace(/\b(chapatis?|chappatis?|chapathis?|phulkas?|rotis?)\b/g, "roti");
  s = s.replace(/\b(soyabeans?|soya chunks?|nutrela)\b/g, "soya");
  s = s.replace(/\b(paneer curry|paneer sabji|paneer sabzi|shahi paneer|matar paneer|kadai paneer)\b/g, "paneer");
  s = s.replace(/\b(egg curry|egg bhurji|anda bhurji|anda curry|andas?|eggs?)\b/g, "egg");
  s = s.replace(/\b(chawal|rices?)\b/g, "rice");
  s = s.replace(/\b(dudh|milks?)\b/g, "milk");
  s = s.replace(/\b(apples?|seb)\b/g, "apple");
  s = s.replace(/\b(bananas?|kelas?|kela)\b/g, "banana");
  s = s.replace(/\b(dals?|daal)\b/g, "dal");
  
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}"""

pattern = re.compile(re.escape(old_func_start) + r'.*?' + re.escape(old_func_end), re.DOTALL)
content = pattern.sub(lambda m: new_func, content)

with open("server.ts", "w") as f:
    f.write(content)
