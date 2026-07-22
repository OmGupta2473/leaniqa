import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

import_statement = "import { WheelPicker } from '@/components/WheelPicker';\n"
if "WheelPicker" not in content:
    content = content.replace("import { CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';", "import { CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';\nimport { WheelPicker } from '@/components/WheelPicker';")

cm_items = "const cmItems = Array.from({ length: 151 }, (_, i) => i + 100);"
ft_items = "const ftItems = [3, 4, 5, 6, 7, 8];"
in_items = "const inItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];"

# add these constants if they don't exist
if "cmItems" not in content:
    content = content.replace("export function OnboardingPage() {", f"{cm_items}\n{ft_items}\n{in_items}\n\nexport function OnboardingPage() {{")

# Find the height step
step_4_old = """                    {heightUnit === 'cm' ? (
                         <div className="flex items-center justify-center gap-4">
                             <input 
                                 type="number" 
                                 autoFocus
                                 value={height}
                                 onChange={(e) => setHeight(e.target.value)}
                                 placeholder="175"
                                 className="w-[160px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                                 onKeyDown={(e) => {
                                     if (e.key === 'Enter' && height) setStep(5);
                                 }}
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">cm</span>
                         </div>
                    ) : (
                         <div className="flex items-center justify-center gap-4">
                             <input 
                                 type="number" 
                                 autoFocus
                                 value={heightFt}
                                 onChange={(e) => setHeightFt(e.target.value)}
                                 placeholder="5"
                                 className="w-[80px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">ft</span>
                             <input 
                                 type="number" 
                                 value={heightIn}
                                 onChange={(e) => setHeightIn(e.target.value)}
                                 placeholder="9"
                                 className="w-[80px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                                 onKeyDown={(e) => {
                                     if (e.key === 'Enter' && heightFt) setStep(5);
                                 }}
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">in</span>
                         </div>
                    )}"""

step_4_new = """                    <div className="w-full max-w-sm h-[300px] relative">
                      <AnimatePresence mode="popLayout">
                        {heightUnit === 'cm' ? (
                            <motion.div 
                              key="cm-picker"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                                <WheelPicker 
                                  items={cmItems} 
                                  value={parseInt(height) || 170} 
                                  onChange={(v) => setHeight(v.toString())} 
                                  unit="cm"
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                              key="ft-picker"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 flex items-center justify-center gap-4"
                            >
                                <WheelPicker 
                                  items={ftItems} 
                                  value={parseInt(heightFt) || 5} 
                                  onChange={(v) => setHeightFt(v.toString())} 
                                  unit="ft"
                                />
                                <WheelPicker 
                                  items={inItems} 
                                  value={parseInt(heightIn) || 8} 
                                  onChange={(v) => setHeightIn(v.toString())} 
                                  unit="in"
                                />
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </div>"""

content = content.replace(step_4_old, step_4_new)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)

