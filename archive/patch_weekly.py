import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { HourlyBarChart } from '../components/HourlyBarChart';",
    "import { MealDistributionChart } from '../components/MealDistributionChart';"
)

old_card = """            {/* Hourly bar chart card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', marginBottom: '12px' }}>Hourly Intake</div>
              <HourlyBarChart hourlyValues={todayActivity.hourlyCalories || Array(24).fill(0)} color={NEON_PINK} height={70} />
            </motion.div>"""

new_card = """            {/* Meal Distribution card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <MealDistributionChart color={NEON_PINK} />
            </motion.div>"""

content = content.replace(old_card, new_card)

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
