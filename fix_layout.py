with open('src/router/layouts/AppLayout.tsx', 'r') as f:
    c = f.read()

c = c.replace('<main className="flex-1 flex flex-col min-w-0 max-w-full">', '<main className="flex-1 flex flex-col min-w-0 max-w-full relative">')

with open('src/router/layouts/AppLayout.tsx', 'w') as f:
    f.write(c)

with open('src/shared/components/Header.tsx', 'r') as f:
    c = f.read()

c = c.replace('className="px-5 flex items-center justify-between shrink-0 z-10"', 'className="px-5 flex items-center justify-between shrink-0 z-50 absolute top-0 left-0 right-0"')

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(c)
