import re

with open("server.ts", "r") as f:
    content = f.read()

old_norm_start = "  s = s.replace(/\\b(dals?|daal)\\b/g, \"dal\");"
old_norm_end = "  s = s.replace(/\\s+/g, ' ').trim();"

new_norm = """  s = s.replace(/\\b(dals?|daal)\\b/g, "dal");
  s = s.replace(/\\b(curd|dahi|yogurt|yoghurt)\\b/g, "curd");
  s = s.replace(/\\b(breads?)\\b/g, "bread");
  s = s.replace(/\\b(chanas?|chickpeas?|garbanzo beans?)\\b/g, "chana");
  s = s.replace(/\\b(sprouts?|moong sprouts?)\\b/g, "sprouts");
  
  s = s.replace(/\\s+/g, ' ').trim();"""

pattern = re.compile(re.escape(old_norm_start) + r'.*?' + re.escape(old_norm_end), re.DOTALL)
content = pattern.sub(lambda m: new_norm, content)

with open("server.ts", "w") as f:
    f.write(content)
