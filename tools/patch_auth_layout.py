with open("src/router/layouts/AuthLayout.tsx", "r") as f:
    content = f.read()
content = content.replace('className="min-h-screen w-full bg-background-primary flex flex-col"', 'className="min-h-[100dvh] w-full flex-1 bg-background-primary flex flex-col"')
with open("src/router/layouts/AuthLayout.tsx", "w") as f:
    f.write(content)
