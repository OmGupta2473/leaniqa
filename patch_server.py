import re

with open('server.ts', 'r') as f:
    content = f.read()

# Change app.post to app.all to support both GET and POST
content = content.replace("app.post('/api/parse-meal', async (req, res) => {", "app.all('/api/parse-meal', async (req, res) => {")

# Extract params from req.query if req.method === 'GET', otherwise req.body
new_extractor = """    try {
      const payload = req.method === 'GET' ? req.query : req.body;
      const { text, mealType, remainingCalories, remainingProtein, userGoal } = payload;"""

content = content.replace("    try {\n      const { text, mealType, remainingCalories, remainingProtein, userGoal } = req.body;", new_extractor)

with open('server.ts', 'w') as f:
    f.write(content)

