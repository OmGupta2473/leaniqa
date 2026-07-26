import re

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

# For Step 1
old_step1 = """                  {bfOptions.map(opt => {
                    const isSelected = currentBfMid === opt.mid;
                    const isRec = recommendedCurrentOpt.mid === opt.mid;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setCurrentBfMid(opt.mid);
                          setTimeout(() => setStep(2), 500); // Auto-advance
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full relative">
                          <BodyFatImagePlaceholder gender={gender} categoryRange={opt.range} className="rounded-none border-none" />"""

new_step1 = """                  {bfOptions.map((opt, idx) => {
                    const isSelected = currentBfMid === opt.mid;
                    const isRec = recommendedCurrentOpt.mid === opt.mid;
                    const p = idx + 1;
                    const imgSrc = `/${gender.toLowerCase()}_physique_${p === 8 ? 7 : p}.png`;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setCurrentBfMid(opt.mid);
                          setTimeout(() => setStep(2), 500); // Auto-advance
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                          <img
                               src={imgSrc}
                               alt={`${gender} Physique ${p}`}
                               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />"""

if old_step1 in content:
    content = content.replace(old_step1, new_step1)
    print("Replaced step 1 successfully.")
else:
    print("Step 1 not found.")

# For Step 2
old_step2 = """                  {bfOptions.filter(opt => currentBfMid ? opt.mid <= currentBfMid : true).map(opt => {
                    const isSelected = targetBfMid === opt.mid;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setTargetBfMid(opt.mid);
                          setTimeout(() => setStep(3), 500); // Auto-advance to AI planning
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full relative">
                          <BodyFatImagePlaceholder gender={gender} categoryRange={opt.range} className="rounded-none border-none" />"""

new_step2 = """                  {bfOptions.filter(opt => currentBfMid ? opt.mid <= currentBfMid : true).map(opt => {
                    const idx = bfOptions.findIndex(o => o.range === opt.range);
                    const p = idx + 1;
                    const imgSrc = `/${gender.toLowerCase()}_physique_${p === 8 ? 7 : p}.png`;
                    const isSelected = targetBfMid === opt.mid;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setTargetBfMid(opt.mid);
                          setTimeout(() => setStep(3), 500); // Auto-advance to AI planning
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                          <img
                               src={imgSrc}
                               alt={`${gender} Physique ${p}`}
                               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />"""

if old_step2 in content:
    content = content.replace(old_step2, new_step2)
    print("Replaced step 2 successfully.")
else:
    print("Step 2 not found.")

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
