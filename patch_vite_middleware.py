import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the top-level await with an async IIFE
old_vite = """  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {"""

new_vite = """  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    })();
  } else {"""

if old_vite in content:
    content = content.replace(old_vite, new_vite)
    print("Patched top-level await.")
else:
    print("Could not find vite middleware block.")

with open('server.ts', 'w') as f:
    f.write(content)

