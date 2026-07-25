import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 mt-4 sm:mt-6 lg:mt-0 lg:absolute lg:top-12 lg:left-12 xl:top-16 xl:left-16 z-10 w-full lg:w-auto">',
    '<div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 mt-4 sm:mt-6 lg:mt-0 z-10 w-full lg:w-auto lg:self-start">'
)

content = content.replace(
    '<div className="hidden lg:flex flex-col justify-center flex-1 z-10 w-full max-w-[500px] lg:self-center py-10 mt-20 lg:mt-0 pt-20 lg:pt-32 pb-10">',
    '<div className="hidden lg:flex flex-col justify-center flex-1 z-10 w-full max-w-[500px] lg:self-center py-10 lg:py-20">'
)

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(content)
