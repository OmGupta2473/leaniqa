with open('server.ts', 'r') as f:
    c = f.read()
c = c.replace("const PORT = parseInt(process.env.PORT || '3000', 10);", "const PORT = 3000;")
with open('server.ts', 'w') as f:
    f.write(c)
