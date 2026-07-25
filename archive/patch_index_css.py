with open("src/index.css", "r") as f:
    content = f.read()
content = content.replace('#root {\n  width: 100%;\n  height: 100dvh;\n  overflow: hidden;\n  display: flex;\n}', '#root {\n  width: 100%;\n  height: 100dvh;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}')
with open("src/index.css", "w") as f:
    f.write(content)
