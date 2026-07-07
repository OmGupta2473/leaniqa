import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

# Add getLocalDateString if not present
if "getLocalDateString" not in content:
    get_local_date = """function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

"""
    # Insert after imports
    imports_end = content.find("\n\n", content.rfind("import "))
    content = content[:imports_end+2] + get_local_date + content[imports_end+2:]

# Update the new Date().toISOString() to getLocalDateString(new Date())
content = content.replace("date: new Date().toISOString()", "date: getLocalDateString(new Date())")

# Update chartData
old_chart_data = """  const chartData = weightLogs.map((log, i) => ({
    name: `Day ${i + 1}`,
    weight: log.weight
  }));"""

new_chart_data = """  const chartData = weightLogs.map((log) => {
    // Some dates might be YYYY-MM-DD or full ISO
    // The timestamp makes it work correctly on XAxis with type="number"
    const parsedDate = new Date(log.date);
    // If log.date is just YYYY-MM-DD, the timezone could shift it, but we can display as UTC
    const name = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return {
      name,
      timestamp: parsedDate.getTime(),
      weight: log.weight
    };
  });"""

content = content.replace(old_chart_data, new_chart_data)

# Update AreaChart XAxis to use timestamp if possible, actually we can just map it based on timestamp
# Wait, if we use XAxis type="number" dataKey="timestamp", we need to provide ticks or tickFormatter
# Or if we just use XAxis dataKey="name" with type="category", Recharts spaces them evenly. 
# The user wants proportional spacing: "Use the actual elapsed days between logs... The X-axis should be based on the actual logged dates, not consecutive entry numbers... Connect consecutive logged points even if several days were skipped."
# To space them by elapsed days, we can use type="number", dataKey="timestamp", scale="time".

old_xaxis = """<XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(235,235,245,0.5)' }} axisLine={false} tickLine={false} />"""

new_xaxis = """<XAxis 
                  dataKey="timestamp" 
                  type="number" 
                  scale="time" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} 
                  tick={{ fontSize: 10, fill: 'rgba(235,235,245,0.5)' }} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={20}
                />"""

content = content.replace(old_xaxis, new_xaxis)

# Also update the tooltip to show date name instead of timestamp
old_tooltip = """<Tooltip 
                  contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'white' }}
                />"""

new_tooltip = """<Tooltip 
                  labelFormatter={(val) => {
                    const d = chartData.find(c => c.timestamp === val);
                    return d ? d.name : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                  }}
                  contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'white' }}
                />"""

content = content.replace(old_tooltip, new_tooltip)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
