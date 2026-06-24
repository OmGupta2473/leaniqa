import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { mealService } from '../services/mealService';
import { weightService } from '../services/weightService';
import { reportService } from '../services/reportService';
import { complianceService } from '../services/complianceService';

export function WeeklyReportScreen() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals'], queryFn: () => mealService.getMeals() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
  const { data: dailyMetrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const { data: scores } = useQuery({ queryKey: ['scores'], queryFn: () => complianceService.getScores() });
  const { data: weeklyReports = [] } = useQuery({ queryKey: ['weeklyReports'], queryFn: () => reportService.getWeeklyReports() });

  const proteinTarget = profile?.protein_target || 150;

  // Real analytics logic for past 7 days from DB
  const today = new Date();
  
  // Calculate week start (Sunday)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const past7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dayStats = past7Days.map(dateStr => {
    const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
    const prot = dayMeals.reduce((acc, m) => acc + m.protein, 0);
    const weightLog = weightLogs.find(w => w.date.startsWith(dateStr));
    
    // Find metric in DB
    const metric = dailyMetrics.find(m => m.date === dateStr);
    const score = metric ? metric.score : 0;

    return {
      date: dateStr,
      day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      prot,
      score,
      weight: weightLog?.weight
    };
  });

  const avgScore = scores?.weeklyAverage || 0;
  const avgProtPct = Math.round(dayStats.filter(d => d.prot > 0).reduce((acc, d) => acc + (d.prot / proteinTarget * 100), 0) / (dayStats.filter(d => d.prot > 0).length || 1));
  
  const startWeight = dayStats.find(d => d.weight)?.weight || profile?.weight || 80;
  const endWeight = dayStats.slice().reverse().find(d => d.weight)?.weight || startWeight;
  const weightChange = (endWeight - startWeight).toFixed(1);

  // Check if report exists for this week
  const currentReport = weeklyReports.find(r => r.week_start === weekStartStr);
  const parsedReport = currentReport ? JSON.parse(currentReport.report) : null;

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: dayStats,
          weights: weightLogs.filter(w => new Date(w.date) >= new Date(past7Days[0])),
          meals: meals.filter(m => new Date(m.meal_time) >= new Date(past7Days[0]))
        })
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      await reportService.saveWeeklyReport(weekStartStr, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReports'] });
    }
  });

  const isSunday = today.getDay() === 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-0.5">Weekly Report</div>
          <div className="text-[14px] font-medium text-text-primary">Last 7 Days</div>
        </div>
        {parsedReport ? (
          <div className="bg-purple/10 border-[0.5px] border-purple/20 text-purple rounded-full px-2.5 py-1 text-[12px] font-medium flex items-center gap-1">
            <Sparkles size={12} /> Generated
          </div>
        ) : isSunday ? (
          <button 
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className="bg-purple text-background-primary rounded-md px-3 py-1.5 text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
          >
            {generateReportMutation.isPending ? 'Analyzing...' : 'Generate Report'}
          </button>
        ) : (
           <div className="text-[12px] text-text-secondary">Generates on Sunday</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-teal">{weightChange}kg</div>
          <div className="text-[10px] text-text-secondary mt-0.5">WEIGHT CHANGE</div>
        </div>
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-blue">{avgProtPct}%</div>
          <div className="text-[10px] text-text-secondary mt-0.5">PROT. COMPLIANCE</div>
        </div>
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-amber">{avgScore}</div>
          <div className="text-[10px] text-text-secondary mt-0.5">AVG SCORE</div>
        </div>
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">Daily Compliance</div>
      <div className="mb-3.5">
        {dayStats.map(d => (
          <div key={d.date} className="flex items-center gap-2 mb-1.5">
            <div className="text-[11px] text-text-secondary w-7 shrink-0">{d.day}</div>
            <div className="flex-1 h-2.5 bg-background-secondary rounded-full overflow-hidden border-[0.5px] border-border-tertiary">
              <div className="h-2.5 rounded-full transition-all duration-300 bg-purple" style={{ width: `${d.score}%` }}></div>
            </div>
            <div className="text-[11px] font-medium w-7 text-right text-text-primary">{d.score}</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">AI Insights</div>
      <div className="flex flex-col gap-2">
        {parsedReport ? (
          <>
            <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-teal bg-background-secondary">
              <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><TrendingUp size={13} className="text-teal" /> Best Habit</div>
              <div className="text-[12px] text-text-secondary">{parsedReport.bestHabit}</div>
            </div>
            <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-coral bg-background-secondary">
              <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><AlertTriangle size={13} className="text-coral" /> Room for Improvement</div>
              <div className="text-[12px] text-text-secondary">{parsedReport.worstHabit}</div>
            </div>
            <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-amber bg-background-secondary">
              <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><Sparkles size={13} className="text-amber" /> Progress Summary</div>
              <div className="text-[12px] text-text-secondary">{parsedReport.progressSummary}</div>
            </div>
            <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-blue bg-background-secondary">
              <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><Calendar size={13} className="text-blue" /> Next Week's Action</div>
              <div className="text-[12px] text-text-secondary">{parsedReport.nextWeekPlan}</div>
            </div>
          </>
        ) : (
          <div className="text-[12px] text-text-secondary italic text-center p-4 border border-border-tertiary rounded-md bg-background-secondary">
            {isSunday ? "Click Generate Report to get your AI insights for the week." : "Check back on Sunday for your automated AI report!"}
          </div>
        )}
      </div>
    </div>
  );
}
