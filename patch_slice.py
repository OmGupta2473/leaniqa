import re

with open("server.ts", "r") as f:
    content = f.read()

old_piece = r"s = s.replace(/(\d+)\s*(pc|pcs|piece|pieces|pic)\b/g, '$1 piece');"
new_piece = r"s = s.replace(/(\d+)\s*(pc|pcs|piece|pieces|pic|slice|slices)\b/g, '$1 piece');"

pattern = re.compile(re.escape(old_piece), re.DOTALL)
content = pattern.sub(lambda m: new_piece, content)

with open("server.ts", "w") as f:
    f.write(content)
