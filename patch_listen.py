import re

with open('server.ts', 'r') as f:
    content = f.read()

listen_block = """  if (process.env.NODE_ENV !== 'production' || process.env.RENDER || process.env.RAILWAY_ENVIRONMENT) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }"""

new_listen_block = """  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }"""

if listen_block in content:
    content = content.replace(listen_block, new_listen_block)
    print("Patched listen block.")
else:
    print("Could not find listen block.")

with open('server.ts', 'w') as f:
    f.write(content)
