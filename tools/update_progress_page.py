import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

# Add imports for projection
new_imports = """import { calculateProjections } from '@/shared/utils/projectionEngine';
import { complianceService } from '@/features/reports/services/complianceService';"""

if "calculateProjections" not in content:
    content = content.replace("import { profileService }", new_imports + "\nimport { profileService }")

# Fetch goal and complianceScore
queries_old = """  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });"""

queries_new = """  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: complianceScore = 0 } = useQuery({ queryKey: ['complianceScore'], queryFn: () => complianceService.getAverageCompliance(14) });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });"""

content = content.replace(queries_old, queries_new)

# Calculate trends and projections
logic_insertion = """  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;

  let actualPace = 0;
  if (weightLogs.length > 1) {
    const firstLog = weightLogs[0];
    const lastLog = weightLogs[weightLogs.length - 1];
    const elapsedMs = new Date(lastLog.date).getTime() - new Date(firstLog.date).getTime();
    const elapsedDays = elapsedMs / 86400000;
    const weightDiff = firstLog.weight - lastLog.weight;
    if (elapsedDays > 0) {
      actualPace = weightDiff / (elapsedDays / 7); // kg lost per week
    }
  }

  const projections = calculateProjections({
    currentWeight,
    currentBf: goal?.current_bf || 25,
    targetBf: goal?.target_bf || 12,
    weeklyDeficitKcal: goal?.deficit_kcal ? goal.deficit_kcal * 7 : 3500,
    complianceScore: complianceScore || 80
  });"""

content = content.replace("  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;", logic_insertion)

# Insert the UI for pace and projections below the chart
ui_old = """      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: 'rgba(235,235,245,0.5)' }}>Weight Trend</div>"""

ui_new = """      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(235,235,245,0.5)' }}>Weight Trend</div>
          {actualPace !== 0 && (
            <div className="text-[11px] font-medium" style={{ color: actualPace > 0 ? '#D4FF00' : '#FF2D55' }}>
              {Math.abs(actualPace).toFixed(2)} kg/wk {actualPace > 0 ? 'lost' : 'gained'}
            </div>
          )}
        </div>"""

content = content.replace(ui_old, ui_new)

# Insert projections list at the bottom
proj_ui = """
      {projections.length > 0 && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '40px' }}>
          <div className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'rgba(235,235,245,0.5)' }}>Milestone Projections</div>
          <div className="flex flex-col gap-3">
            {projections.map((p, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-text-primary">{p.bfTarget}% BF</span>
                  <span className="text-[12px] text-text-secondary">~{p.estWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-text-primary">
                    {p.status === 'completed' ? 'Completed' : p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[12px]" style={{ color: p.status === 'completed' ? '#D4FF00' : 'rgba(235,235,245,0.5)' }}>
                    {p.status === 'completed' ? 'Achieved' : `in ${p.weeks} weeks`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-text-secondary text-center">
            Based on current {complianceScore.toFixed(0)}% compliance and {(goal?.deficit_kcal || 500) * 7} kcal weekly deficit.
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", proj_ui)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
