with open('src/LandingPage.tsx') as f:
    c = f.read()
    if 'space-y-12 md:space-y-0' in c:
        print("Found space-y-12 md:space-y-0")
