with open("src/shared/components/BottomNav.tsx", "r") as f:
    c = f.read()

c = c.replace("\\n", "\n")

with open("src/shared/components/BottomNav.tsx", "w") as f:
    f.write(c)
