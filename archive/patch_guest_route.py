with open("src/router/GuestRoute.tsx", "r") as f:
    content = f.read()
content = content.replace('className="min-h-screen flex items-center', 'className="min-h-screen w-full flex items-center')
with open("src/router/GuestRoute.tsx", "w") as f:
    f.write(content)
