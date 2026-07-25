with open("src/shared/components/BottomNav.tsx", "r") as f:
    c = f.read()

c = c.replace('import { motion, AnimatePresence } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";\nimport { haptics } from "@/shared/utils/haptics";')
c = c.replace('''              onClick={(e) => {
                if (!hasCompletedOnboarding) {
                  e.preventDefault();
                }
              }}''', '''              onClick={(e) => {
                if (!hasCompletedOnboarding) {
                  e.preventDefault();
                } else {
                  haptics.tap();
                }
              }}''')

with open("src/shared/components/BottomNav.tsx", "w") as f:
    f.write(c)

