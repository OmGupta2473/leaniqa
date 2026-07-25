import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# Find the end of the success state in InteractiveMealDemo and add the AI Insight card.
# I'll replace the AnimatePresence mode="wait" content.

new_success_block = """
            {state === 'success' && (
              <motion.div
                key="btn-success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="w-full flex flex-col gap-3"
              >
                {/* Result Card */}
                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[28px] font-bold text-[#D4FF00] tracking-tight leading-none">
                          <motion.span>{cal}</motion.span> <span className="text-base text-zinc-400 font-medium tracking-normal">kcal</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[rgba(212,255,0,0.15)] text-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.2)]">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[rgba(255,255,255,0.03)] rounded-2xl p-3 flex flex-col">
                      <div className="text-white font-bold text-lg leading-tight tracking-tight">
                        <motion.span>{pro}</motion.span>g
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Protein</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[rgba(255,255,255,0.03)] rounded-2xl p-3 flex flex-col">
                      <div className="text-white font-bold text-lg leading-tight tracking-tight">
                        <motion.span>{fat}</motion.span>g
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Fat</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[rgba(255,255,255,0.03)] rounded-2xl p-3 flex flex-col">
                      <div className="text-white font-bold text-lg leading-tight tracking-tight">
                        <motion.span>{carbs}</motion.span>g
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Carbs</div>
                    </motion.div>
                  </div>
                </div>
                
                {/* AI Insight Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.6 }}
                  className="bg-[rgba(55,138,221,0.1)] border border-[rgba(55,138,221,0.2)] rounded-2xl p-4 flex gap-3 items-start"
                >
                  <div className="text-[#378ADD] mt-0.5">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-sm text-[rgba(255,255,255,0.8)] leading-relaxed">
                    Great choice! This meal provides excellent lean protein from eggs, perfectly balanced with energy-sustaining carbs from the rice.
                  </div>
                </motion.div>
              </motion.div>
            )}
"""

pattern = re.compile(r"\{state === 'success' && \(\s*<motion\.div.*?key=\"btn-success\".*?</motion\.div>\s*\)\}", re.DOTALL)
content = pattern.sub(new_success_block.strip(), content)

# Check if Sparkles is imported
if 'Sparkles' not in content:
    content = content.replace('RotateCcw}', 'RotateCcw, Sparkles}')

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updated insight card.")
