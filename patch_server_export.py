import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace async function startServer() { with const app = express();
content = content.replace("async function startServer() {\n  const app = express();\n  const PORT = 3000;", "export const app = express();\nconst PORT = process.env.PORT || 3000;")

# Find the end of the Vite middleware where it does app.listen
listen_block = """  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();"""

new_listen_block = """  if (process.env.NODE_ENV !== 'production' || process.env.RENDER || process.env.RAILWAY_ENVIRONMENT) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }"""

if listen_block in content:
    content = content.replace(listen_block, new_listen_block)
    print("Patched startServer and listen successfully.")
else:
    print("Could not find listen block.")

with open('server.ts', 'w') as f:
    f.write(content)
