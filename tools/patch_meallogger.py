import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    c = f.read()

# 1. Add import for useCalculatedProfile
import_stmt = "import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';\n"
if "useCalculatedProfile" not in c:
    import_end = c.rfind("import ")
    newline_after = c.find("\n", import_end)
    c = c[:newline_after+1] + import_stmt + c[newline_after+1:]

# 2. Add useCalculatedProfile call
call_stmt = "\n  const { profileData: onboardingData } = useCalculatedProfile();"
c = re.sub(
    r'(const \{ data: goal \} = useQuery\(\{ queryKey: \["goal"\], queryFn: \(\) => profileService\.getGoal\(\) \}\);)',
    r'\1' + call_stmt,
    c
)

# 3. Update target calculations
target_old = """  const maintKcal = profile?.maintenance_kcal || 2200;
  const dailyTargetKcal = maintKcal - (goal?.deficit_kcal ?? 400);
  const proteinTarget = profile?.protein_target || 150;"""

target_new = """  const dailyTargetKcal = (profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : onboardingData?.dailyCalorieGoal) || 0;
  const proteinTarget = (profile?.protein_target ?? onboardingData?.proteinMid) || 0;
  const fatTarget = onboardingData?.fatMid || 0;
  const carbsTarget = onboardingData?.carbMid || 0;"""

c = c.replace(target_old, target_new)

# 4. Update the macros row 
macros_old = """        {/* Macros row */}
        <div className="grid grid-cols-4 gap-[8px] mt-[14px] pt-[12px] border-t border-[rgba(255,255,255,0.06)]">
          {[{ label: 'Kcal', val: eatenKcal, color: '#FF4D1C' }, { label: 'Protein', val: `${eatenProtein}g`, color: '#378ADD' }, { label: 'Fat', val: `${eatenFat}g`, color: 'white' }, { label: 'Carbs', val: `${eatenCarbs}g`, color: 'white' }].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[14px] font-bold" style={{ color: item.color }}>{item.val}</div>
              <div className="text-[10px] text-[rgba(235,235,245,0.4)] mt-[1px]">{item.label}</div>
            </div>
          ))}
        </div>"""

macros_new = """        {/* Macros row */}
        <div className="grid grid-cols-4 gap-[8px] mt-[14px] pt-[12px] border-t border-[rgba(255,255,255,0.06)]">
          {[{ label: 'Kcal', val: eatenKcal, target: dailyTargetKcal, unit: 'kcal', color: '#FF4D1C' }, { label: 'Protein', val: eatenProtein, target: proteinTarget, unit: 'g', color: '#378ADD' }, { label: 'Fat', val: eatenFat, target: fatTarget, unit: 'g', color: 'white' }, { label: 'Carbs', val: eatenCarbs, target: carbsTarget, unit: 'g', color: 'white' }].map(item => (
            <div key={item.label} className="text-center flex flex-col items-center">
              <div className="text-[14px] font-bold flex items-baseline gap-[1px]" style={{ color: item.color }}>
                {item.val}
                <span className="text-[10px] font-medium opacity-60">/ {item.target}{item.unit}</span>
              </div>
              <div className="text-[10px] text-[rgba(235,235,245,0.5)] uppercase tracking-wide mt-[1px]">{item.label}</div>
            </div>
          ))}
        </div>"""

c = c.replace(macros_old, macros_new)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(c)

