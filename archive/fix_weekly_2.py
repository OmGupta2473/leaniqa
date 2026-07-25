with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

search_str = """  const isLoading = profileLoading || goalLoading || mealsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }"""

replace_str = """  const isLoading = profileLoading || goalLoading || mealsLoading || metricsLoading;"""

content = content.replace(search_str, replace_str)


search_str2 = """  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return ("""

replace_str2 = """  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  return ("""

content = content.replace(search_str2, replace_str2)

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)
