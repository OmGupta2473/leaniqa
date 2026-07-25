import re

def patch_file(file, old, new):
    with open(file, "r") as f:
        c = f.read()
    c = c.replace(old, new)
    with open(file, "w") as f:
        f.write(c)

patch_file(
    "src/shared/components/Header.tsx",
    "onClick={() => navigate('/')}",
    "onClick={() => navigate('/dashboard')}"
)

patch_file(
    "src/shared/components/Sidebar.tsx",
    "onClick={() => navigate('/')}",
    "onClick={() => navigate('/dashboard')}"
)

