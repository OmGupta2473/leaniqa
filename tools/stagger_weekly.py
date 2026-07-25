import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

# Add variants to the top of the file
variants = """
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};
"""

content = content.replace("export function WeeklyReportPage() {", variants + "\nexport function WeeklyReportPage() {")

# Replace dashboard wrapper
old_dash_wrap = """          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >"""
new_dash_wrap = """          <motion.div
            key="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >"""
content = content.replace(old_dash_wrap, new_dash_wrap)

# Replace detail wrapper
old_detail_wrap = """          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >"""
new_detail_wrap = """          <motion.div
            key="detail"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >"""
content = content.replace(old_detail_wrap, new_detail_wrap)


# In Dashboard: wrap the 4 cards with motion.div variants={itemVariants}
content = content.replace("<div style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px'", 
                          "<motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px'")

# Wait, `</div>` matching is tricky. Let's just use regex for `<div style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)'` -> `<motion.div variants={itemVariants} style={{ background: 'linear-gradient...`
# And then we have to match the closing `</div>`. 

# For detail view:
# The 7-day strip is also a gradient card.
# The `last7Days.map` items have `borderRadius: '16px'`.
content = content.replace("<div key={day.date} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px'",
                          "<motion.div key={day.date} variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px'")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
