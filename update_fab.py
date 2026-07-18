import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

# Replace the FAB
c = re.sub(r'\{/\* Log meal FAB \*/\}.*?</Profiler>', '</Profiler>', c, flags=re.DOTALL)

old_up_next = """              {/* Next Meal Suggestion */}
              <motion.div 
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/meals')}
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm cursor-pointer flex flex-col justify-between h-[130px]"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Up Next</div>
                  <TrendingUp size={16} className="text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white leading-snug mb-2">
                    {remainingProtein <= 0 ? "Goal met!" : (remainingProtein > 30 ? "Chicken Breast" : "Greek Yogurt")}
                  </div>
                  {remainingProtein > 0 && (
                     <div className="inline-block bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[10px] font-bold px-2 py-0.5 rounded">
                       ~{remainingProtein > 30 ? '350' : '200'} kcal
                     </div>
                  )}
                </div>
              </motion.div>"""

new_up_next = """              {/* Next Meal Suggestion */}
              <motion.div 
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/meals')}
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm cursor-pointer flex flex-col justify-between h-[130px] relative"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Up Next</div>
                  <TrendingUp size={16} className="text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white leading-snug mb-2 pr-10">
                    {remainingProtein <= 0 ? "Goal met!" : (remainingProtein > 30 ? "Chicken Breast" : "Greek Yogurt")}
                  </div>
                  {remainingProtein > 0 && (
                     <div className="inline-block bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[10px] font-bold px-2 py-0.5 rounded">
                       ~{remainingProtein > 30 ? '350' : '200'} kcal
                     </div>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Plus size={20} strokeWidth={2.5} color="#000" />
                </div>
              </motion.div>"""

c = c.replace(old_up_next, new_up_next)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

