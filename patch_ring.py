import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

# Update circumference
c = c.replace("const circumference = 2 * Math.PI * 60;", "const circumference = 2 * Math.PI * 68;")

# Update the ring card
old_ring = """          <motion.div 
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/calorie')}
            className="card-base mb-4 relative flex items-center justify-center py-8 cursor-pointer"
          >
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="#D4FF00" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: mounted ? strokeDashoffset : circumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[32px] font-bold tracking-tight text-white leading-none mb-1">
                <AnimatedNumber value={eatenKcal} duration={1000} />
              </div>
              <div className="text-[13px] text-[rgba(255,255,255,0.4)] mb-2">
                / {dailyTargetKcal || 0} kcal
              </div>
              <div className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${eatenKcal > dailyTargetKcal && dailyTargetKcal > 0 ? 'bg-[rgba(255,77,28,0.15)] text-[#FF4D1C]' : 'bg-[rgba(212,255,0,0.1)] text-[#D4FF00]'}`}>
                {getRemainingText(eatenKcal, dailyTargetKcal, ' kcal')}
              </div>
            </div>
          </motion.div>"""

new_ring = """          <motion.div 
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/calorie')}
            className="card-base mb-4 flex flex-col items-center justify-center py-6 cursor-pointer"
          >
            <div className="relative flex items-center justify-center mb-4 mt-2">
              <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                <circle cx="80" cy="80" r="68" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="80" cy="80" r="68" fill="transparent" stroke="#D4FF00" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: mounted ? strokeDashoffset : circumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <div className="text-[36px] font-bold tracking-tight text-white leading-none mb-1">
                  <AnimatedNumber value={eatenKcal} duration={1000} />
                </div>
                <div className="text-[13px] text-[rgba(255,255,255,0.4)]">
                  / {dailyTargetKcal || 0} kcal
                </div>
              </div>
            </div>
            <div className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 mb-2 rounded-full ${eatenKcal > dailyTargetKcal && dailyTargetKcal > 0 ? 'bg-[rgba(255,77,28,0.15)] text-[#FF4D1C]' : 'bg-[rgba(212,255,0,0.1)] text-[#D4FF00]'}`}>
              {getRemainingText(eatenKcal, dailyTargetKcal, ' kcal')}
            </div>
          </motion.div>"""

c = c.replace(old_ring, new_ring)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

