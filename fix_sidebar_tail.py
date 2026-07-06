with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace("  );\n});", "  );\n}")
content = content.replace("  );\n});\n", "  );\n}\n")

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)
