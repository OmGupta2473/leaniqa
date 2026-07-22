import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("""{aiStatus === 3 && <motion.p key="msg3" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Generating nutrition targets...</motion.p>}
                            {aiStatus === 4 && <motion.p key="msg4" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Almost ready...</motion.p>}""",
"""{aiStatus === 3 && <motion.p key="msg3" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Generating nutrition targets...</motion.p>}
                            {aiStatus === 4 && <motion.p key="msg4" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Building your transformation roadmap...</motion.p>}
                            {aiStatus === 5 && <motion.p key="msg5" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Almost ready...</motion.p>}""")

content = content.replace("""            await new Promise(r => setTimeout(r, 800));
            setAiStatus(4);
            await new Promise(r => setTimeout(r, 800));""", """            await new Promise(r => setTimeout(r, 800));
            setAiStatus(4);
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(5);
            await new Promise(r => setTimeout(r, 800));""")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
