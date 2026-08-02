import sys

with open('index.html', 'r') as f:
    content = f.read()

target = """    <link rel="icon" type="image/png" href="/LQ.png" />
    <link rel="apple-touch-icon" href="/LQ.png" />"""

replacement = """    <link rel="icon" type="image/png" href="/LQ-64.png" />
    <link rel="apple-touch-icon" href="/LQ-192.png" />"""

if target in content:
    content = content.replace(target, replacement)
    with open('index.html', 'w') as f:
        f.write(content)
    print("Replaced HTML successfully")
else:
    print("HTML Target not found!")
