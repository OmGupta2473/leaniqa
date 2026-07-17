import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    "emailRedirectTo: window.location.origin,",
    "emailRedirectTo: `${window.location.origin}/redirect`,"
)

c = c.replace(
    "redirectTo: window.location.origin",
    "redirectTo: `${window.location.origin}/redirect`"
)

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(c)

