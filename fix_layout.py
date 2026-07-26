with open('src/router/layouts/AppLayout.tsx', 'r') as f:
    c = f.read()

c = c.replace('<Header />\n            <div className="flex flex-col flex-1 w-full">', '<div className="flex flex-col flex-1 w-full">')
c = c.replace('{children || (', '<Header />\n        {children || (')

with open('src/router/layouts/AppLayout.tsx', 'w') as f:
    f.write(c)

with open('src/shared/components/Header.tsx', 'r') as f:
    c = f.read()

c = c.replace('className="px-5 flex items-center justify-between shrink-0 z-50 sticky top-0 w-full"', 'className="px-5 flex items-center justify-between shrink-0 z-50 w-full"')

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(c)
