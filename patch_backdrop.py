import re

with open("src/features/nutrition/components/CustomMealModal.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div \n          className="fixed inset-0 z-[100]',
    '<motion.div \n          initial={{ opacity: 0 }}\n          animate={{ opacity: 1 }}\n          exit={{ opacity: 0 }}\n          className="fixed inset-0 z-[100]'
)
content = content.replace(
    '</motion.div>\n        </div>',
    '</motion.div>\n        </motion.div>'
)

with open("src/features/nutrition/components/CustomMealModal.tsx", "w") as f:
    f.write(content)
