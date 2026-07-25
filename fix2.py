with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    c = f.read()

c = c.replace("<AnimatePresence>\n          {resetGoalConfirm && createPortal(\n            <motion.div ", "{typeof document !== 'undefined' && createPortal(\n        <AnimatePresence>\n          {resetGoalConfirm && (\n            <motion.div ")

c = c.replace("              </motion.div>\n            </motion.div>\n          , document.body)}\n        </AnimatePresence>", "              </motion.div>\n            </motion.div>\n          )}\n        </AnimatePresence>,\n        document.body\n      )}")

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(c)
