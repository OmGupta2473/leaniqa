import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DailyHistoryChartProps {
  logs: {
    date: string;
    actual: number;
    target: number;
  }[];
  todayStr: string;
  unit: string;
  type: "calorie" | "protein";
}

export function DailyHistoryChart({ logs, todayStr, unit, type }: DailyHistoryChartProps) {
  // 1. Sort logs and fill missing days
  const filledLogs = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return [];

    const startDate = new Date(sorted[0].date);
    const today = new Date(todayStr);
    
    const result = [];
    let current = new Date(startDate);
    let i = 0;
    let dayNum = 1;
    let lastTarget = sorted[0].target;

    while (current <= today) {
      const currentStr = current.toISOString().split("T")[0];
      if (i < sorted.length && sorted[i].date === currentStr) {
        lastTarget = sorted[i].target;
        result.push({ ...sorted[i], dayNum });
        i++;
      } else {
        result.push({
          date: currentStr,
          actual: 0,
          target: lastTarget,
          dayNum
        });
      }
      current.setUTCDate(current.getUTCDate() + 1);
      dayNum++;
    }
    return result;
  }, [logs, todayStr]);

  const totalDays = filledLogs.length;
  const maxPage = Math.max(1, Math.ceil(totalDays / 7));
  const [currentPage, setCurrentPage] = useState(maxPage);

  // Auto-shift to latest page when total days increase
  useEffect(() => {
    setCurrentPage(maxPage);
  }, [maxPage]);

  const startIndex = (currentPage - 1) * 7;
  const pageData = filledLogs.slice(startIndex, startIndex + 7);
  
  const displayDays = Array.from({ length: 7 }).map((_, i) => pageData[i] || null);

  const validDays = displayDays.filter(d => d !== null);
  const currentTarget = validDays.length > 0 ? validDays[validDays.length - 1].target : 0;
  
  const chartAreaHeight = 120;
  const maxVal = Math.max(...displayDays.map(d => d ? d.actual : 0), currentTarget * 1.2, 10);
  const targetLineBottom = (currentTarget / maxVal) * chartAreaHeight;

  return (
    <div className="glass-card p-[16px] mb-[24px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[16px]">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`w-[32px] h-[32px] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-center ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[rgba(255,255,255,0.03)] active:scale-95 transition-all'}`}
        >
          <ChevronLeft size={18} color="white" />
        </button>
        <div className="text-[18px] font-semibold tracking-tight text-white tracking-[-0.2px]">
          Days {startIndex + 1} – {startIndex + 7}
        </div>
        <button 
          onClick={() => setCurrentPage(p => Math.min(maxPage, p + 1))}
          disabled={currentPage === maxPage}
          className={`w-[32px] h-[32px] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-center ${currentPage === maxPage ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[rgba(255,255,255,0.03)] active:scale-95 transition-all'}`}
        >
          <ChevronRight size={18} color="white" />
        </button>
      </div>
      
      {/* Target top right */}
      <div className="flex justify-end mb-[24px]">
        <div className="text-[13px] text-[#EBEBF599]">
          Target: <span className="text-[#D4FF00] font-bold">{currentTarget} {unit}</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex items-end justify-between px-[10px] pb-[28px] mb-[16px]" style={{ height: `${chartAreaHeight + 28}px` }}>
        {/* Target dashed line */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-[#D4FF00] opacity-50 z-0" 
          style={{ bottom: `${targetLineBottom + 28}px` }}
        />
        
        {displayDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="w-[30px]" />;
          
          const isToday = day.date === todayStr;
          
          let isSuccess = false;
          if (type === "calorie") {
             isSuccess = day.actual <= day.target && day.actual > 0;
          } else {
             isSuccess = day.actual >= day.target && day.actual > 0;
          }

          const barColor = isToday ? "#737373" : (isSuccess ? "#D4FF00" : "#FF4D1C");
          const heightPct = Math.min(100, (day.actual / maxVal) * 100);
          
          const [y, m, d] = day.date.split("-");
          const formattedDate = `${parseInt(d)}/${parseInt(m)}`;
          
          return (
            <div key={day.date} className="relative z-10 flex flex-col items-center justify-end h-full w-[30px]">
              <div className="text-[10px] font-medium text-white mb-[4px] whitespace-nowrap">
                {day.actual}{isToday ? '*' : ''}
              </div>
              <div 
                style={{ height: `calc(${heightPct}% - 28px)`, backgroundColor: barColor }} 
                className="w-[20px] rounded-t-[4px] min-h-[4px] transition-all duration-500 ease-out"
              />
              <div className="absolute bottom-0 flex flex-col items-center justify-end h-[28px] pb-1">
                <span className="text-[10px] text-[#EBEBF599] font-bold">D{day.dayNum}</span>
                <span className="text-[8px] text-[rgba(235,235,245,0.4)]">{formattedDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-[16px]">
        <div className="flex items-center gap-[6px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#D4FF00]"></div>
          <span className="text-[11px] text-[#EBEBF599] uppercase tracking-[0.05em] font-medium">{type === "calorie" ? "Under Target" : "Target Hit"}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#FF4D1C]"></div>
          <span className="text-[11px] text-[#EBEBF599] uppercase tracking-[0.05em] font-medium">{type === "calorie" ? "Over Target" : "Missed Target"}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#737373]"></div>
          <span className="text-[11px] text-[#EBEBF599] uppercase tracking-[0.05em] font-medium">In Calculation (Today)</span>
        </div>
      </div>
    </div>
  );
}
