import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_badge = """                                    <img 
                                        src={`/male_physique_${p === 8 ? 7 : p}.png`} 
                                        alt={`Male Physique ${p}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23333"><rect width="100%" height="100%"/></svg>';
                                        }}
                                    />
                                    {physique === p && ("""

new_badge = """                                    <img 
                                        src={`/male_physique_${p === 8 ? 7 : p}.png`} 
                                        alt={`Male Physique ${p}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23333"><rect width="100%" height="100%"/></svg>';
                                        }}
                                    />
                                    {(() => {
                                        const h = getComputedHeight();
                                        const w = parseFloat(weight) || 80;
                                        const a = parseFloat(age) || 30;
                                        const g = gender || 'Male';
                                        let isRec = false;
                                        if (h > 0 && w > 0) {
                                            const bmi = w / Math.pow(h / 100, 2);
                                            const bf = g === 'Male' ? (1.20 * bmi) + (0.23 * a) - 16.2 : (1.20 * bmi) + (0.23 * a) - 5.4;
                                            
                                            const maleMids = [5, 10, 13.5, 17.5, 22.5, 27.5, 35, 45];
                                            const femaleMids = [12, 17, 22, 27, 32.5, 37.5, 45, 55];
                                            const mids = g === 'Male' ? maleMids : femaleMids;
                                            
                                            // Find closest mid
                                            let closestIdx = 0;
                                            let minDiff = Infinity;
                                            for (let i = 0; i < mids.length; i++) {
                                                const diff = Math.abs(mids[i] - bf);
                                                if (diff < minDiff) {
                                                    minDiff = diff;
                                                    closestIdx = i;
                                                }
                                            }
                                            isRec = (closestIdx + 1 === p);
                                        }
                                        if (!isRec) return null;
                                        return (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-[#D4FF00] border border-[rgba(212,255,0,0.3)] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                                Estimate
                                            </div>
                                        );
                                    })()}
                                    {physique === p && ("""

if old_badge in content:
    content = content.replace(old_badge, new_badge)
    print("Patched badge")
else:
    print("Badge not found")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
