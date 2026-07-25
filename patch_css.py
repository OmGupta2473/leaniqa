with open('src/index.css', 'r') as f:
    c = f.read()

old_focus = """*:focus-visible {
  outline: 2px solid #D4FF00;
  outline-offset: 2px;
}"""

new_focus = """*:focus-visible {
  outline: 2px solid #D4FF00;
  outline-offset: 2px;
}

.outline-none:focus-visible {
  outline: none !important;
}"""

if old_focus in c:
    c = c.replace(old_focus, new_focus)
    with open('src/index.css', 'w') as f:
        f.write(c)
    print("Patched index.css")
else:
    print("Could not find focus block")
