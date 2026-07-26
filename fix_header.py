with open('src/shared/components/Header.tsx', 'r') as f:
    c = f.read()

c = c.replace('const showBack = [\'/awards\', \'/profile\'].includes(location.pathname);', 'const showBack = false;')

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(c)
