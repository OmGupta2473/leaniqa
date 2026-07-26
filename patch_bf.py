import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_header = """                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-center">Does this look similar to your current physique?</h2>
                    <p className="text-center text-zinc-400 mb-8">Select the image that closest matches your body right now.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto overflow-y-auto pb-8">"""

new_header = """                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] px-4 py-2 rounded-full mb-6">
                            <span className="text-xl">✨</span>
                            <span className="text-[14px] font-semibold text-white">Estimated Body Fat: <span className="text-[#D4FF00]">{
                                (() => {
                                    const h = getComputedHeight();
                                    const w = parseFloat(weight) || 80;
                                    const a = parseFloat(age) || 30;
                                    const g = gender || 'Male';
                                    if (h > 0 && w > 0) {
                                        const bmi = w / Math.pow(h / 100, 2);
                                        const bf = g === 'Male' ? (1.20 * bmi) + (0.23 * a) - 16.2 : (1.20 * bmi) + (0.23 * a) - 5.4;
                                        return Math.max(5, Math.round(bf)) + "%";
                                    }
                                    return "--%";
                                })()
                            }</span></span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-center">Does this look similar to your current physique?</h2>
                        <p className="text-center text-zinc-400">Select the image that closest matches your body right now.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto overflow-y-auto pb-8">"""

if old_header in content:
    content = content.replace(old_header, new_header)
    print("Patched header")
else:
    print("Header not found")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
