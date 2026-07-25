with open('src/features/awards/pages/AwardsPage.tsx', 'r') as f:
    c = f.read()
c = c.replace("        , document.body)}\n      </AnimatePresence>", "          )}\n        </AnimatePresence>,\n        document.body\n      )}")
with open('src/features/awards/pages/AwardsPage.tsx', 'w') as f:
    f.write(c)
