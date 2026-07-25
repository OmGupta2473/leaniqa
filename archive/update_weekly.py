import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

# Add imports
imports = """import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { springTap } from '../components/motion';"""

content = content.replace("import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';", 
                          "import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';\n" + imports)

# Styles
card_style_old = "background: '#1C1C1E', borderRadius: '20px'"
card_style_new = "background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px'"

content = content.replace("background: '#1C1C1E', borderRadius: '20px'", card_style_new)
content = content.replace("background: '#1C1C1E', borderRadius: '16px'", card_style_new.replace("20px", "16px"))

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
