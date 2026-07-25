import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent"',
    'className="fixed bottom-[80px] left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-40"'
)

content = content.replace(
    'className="w-full max-w-lg mx-auto block py-4 rounded-full bg-[#D4FF00]',
    'className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-[#D4FF00]'
)

content = content.replace(
    'className="w-full max-w-lg mx-auto block py-4 rounded-full bg-white text-black',
    'className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-white text-black'
)


with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
