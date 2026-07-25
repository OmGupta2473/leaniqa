with open('index.html', 'r') as f:
    content = f.read()

head_addition = """    <meta name="description" content="LeanIQA is your personal AI-powered fitness and nutrition companion. Track meals, goals, and progress effortlessly." />
    <meta name="theme-color" content="#080809" />
    <link rel="canonical" href="https://leaniqa.com" />
    <meta property="og:title" content="LeanIQA" />
    <meta property="og:description" content="Your Smart Fitness Companion" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="LeanIQA" />
    <meta name="twitter:description" content="Your Smart Fitness Companion" />"""

if '<meta name="description"' not in content:
    content = content.replace('<title>', head_addition + '\n    <title>')

with open('index.html', 'w') as f:
    f.write(content)
