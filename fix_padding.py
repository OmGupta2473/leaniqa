with open('src/router/layouts/AppLayout.tsx', 'r') as f:
    c = f.read()

c = c.replace('className="app-scroll flex-1 overflow-y-auto scroll-smooth"', 'className="app-scroll flex-1 overflow-y-auto scroll-smooth pt-[52px]"')

with open('src/router/layouts/AppLayout.tsx', 'w') as f:
    f.write(c)
