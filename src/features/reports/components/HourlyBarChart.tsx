interface HourlyBarChartProps {
  hourlyValues: number[]; // length 24
  color: string;
  height?: number;
}

export function HourlyBarChart({ hourlyValues, color, height = 80 }: HourlyBarChartProps) {
  const safeValues = hourlyValues.length === 24 ? hourlyValues : Array(24).fill(0);
  const maxVal = Math.max(...safeValues, 1); // auto-scaling ceiling based on day's max
  const barWidth = 100 / 24;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: '1px', width: '100%' }}>
      {safeValues.map((val, hour) => {
        const barHeightPct = (val / maxVal) * 100;
        const isCurrentHour = hour === new Date().getHours();
        return (
          <div
            key={hour}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
            }}
            title={`${hour}:00 — ${val}`}
          >
            <div
              style={{
                width: '100%',
                height: `${Math.max(barHeightPct, val > 0 ? 4 : 0)}%`,
                background: isCurrentHour ? color : `${color}99`,
                borderRadius: '2px 2px 0 0',
                transition: 'height 0.4s ease',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
