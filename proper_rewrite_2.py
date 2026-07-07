import re

with open("/tmp/original_weekly.txt", "r") as f:
    content = f.read()

# Add variants and imports
imports = """import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { springTap } from '../components/motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};
"""

content = content.replace("import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';", 
                          "import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';\n" + imports)


# Segmented control
old_segmented = """          <div style={{ display: 'flex', gap: '6px', background: '#1C1C1E', borderRadius: '10px', padding: '3px' }}>
            {(['dashboard', 'detail', 'calendar'] as ActivityView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: view === v ? NEON_PINK : 'transparent',
                  color: view === v ? 'white' : 'rgba(235,235,245,0.5)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {v === 'dashboard' ? 'Day' : v === 'detail' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>"""

new_segmented = """          <div style={{ display: 'flex', gap: '2px', background: '#1C1C1E', borderRadius: '10px', padding: '3px', position: 'relative' }}>
            {(['dashboard', 'detail', 'calendar'] as ActivityView[]).map(v => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                whileTap={springTap}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: 'transparent',
                  color: view === v ? 'white' : 'rgba(235,235,245,0.5)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  position: 'relative',
                  zIndex: 1,
                  outline: 'none',
                }}
              >
                {v === 'dashboard' ? 'Day' : v === 'detail' ? 'Week' : 'Month'}
                {view === v && (
                  <motion.div
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ position: 'absolute', inset: 0, background: NEON_PINK, borderRadius: '7px', zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </div>"""

content = content.replace(old_segmented, new_segmented)

# Replace Dashboard View Block
dashboard_block_old = """        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <>
            {/* Ring summary card */}
            <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '24px', marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '8px' }}>
                <ProgressRing current={todayActivity.caloriesConsumed} goal={todayActivity.calorieTarget} size={200} strokeWidth={16} color={NEON_PINK}>
                  <div style={{ fontSize: '32px', fontWeight: 800 }}>{todayActivity.caloriesConsumed}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>/ {todayActivity.calorieTarget} kcal</div>
                </ProgressRing>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                {[
                  { label: 'Protein', current: todayActivity.proteinConsumed, goal: todayActivity.proteinTarget, color: ELECTRIC_LIME, unit: 'g' },
                  { label: 'Fat', current: todayActivity.fatConsumed, goal: todayActivity.fatTarget, color: ELECTRIC_BLUE, unit: 'g' },
                  { label: 'Carbs', current: todayActivity.carbsConsumed, goal: todayActivity.carbsTarget, color: '#FFD60A', unit: 'g' },
                ].map(m => (
                  <ProgressRing key={m.label} current={m.current} goal={m.goal} size={64} strokeWidth={7} color={m.color}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{m.current}</div>
                  </ProgressRing>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['Protein', 'Fat', 'Carbs'].map(l => (
                  <div key={l} style={{ width: 64, textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Hourly bar chart card */}
            <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', marginBottom: '12px' }}>Hourly Intake</div>
              <HourlyBarChart hourlyValues={todayActivity.hourlyCalories || Array(24).fill(0)} color={NEON_PINK} height={70} />
            </div>

            {/* Trends card */}
            <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Flame size={16} color={ELECTRIC_LIME} />
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Trends</div>
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', lineHeight: 1.5 }}>
                {currentStreak > 0 ? `You're on a ${currentStreak}-day daily streak. ` : 'Log today to start a new streak. '}

              </div>
            </div>

            {/* Awards row */}
            <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Trophy size={16} color={NEON_PINK} />
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Recent Awards</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {recentBadges.length === 0 ? (
                  <div style={{ gridColumn: 'span 6', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)', textAlign: 'center', padding: '12px 0' }}>No awards yet — keep your streak going</div>
                ) : recentBadges.map(a => (
                  <div key={a.id} style={{ aspectRatio: '1', borderRadius: '10px', border: `1.5px solid ${a.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${a.primaryColor}1A` }}>
                    {a.symbol}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}"""

dashboard_block_new = """        <AnimatePresence mode="wait">
        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="show" exit="exit">
            {/* Ring summary card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '8px' }}>
                <ProgressRing current={todayActivity.caloriesConsumed} goal={todayActivity.calorieTarget} size={200} strokeWidth={16} color={NEON_PINK}>
                  <AnimatedNumber value={todayActivity.caloriesConsumed} style={{ fontSize: '32px', fontWeight: 800 }} />
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>/ {todayActivity.calorieTarget} kcal</div>
                </ProgressRing>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                {[
                  { label: 'Protein', current: todayActivity.proteinConsumed, goal: todayActivity.proteinTarget, color: ELECTRIC_LIME, unit: 'g' },
                  { label: 'Fat', current: todayActivity.fatConsumed, goal: todayActivity.fatTarget, color: ELECTRIC_BLUE, unit: 'g' },
                  { label: 'Carbs', current: todayActivity.carbsConsumed, goal: todayActivity.carbsTarget, color: '#FFD60A', unit: 'g' },
                ].map(m => (
                  <motion.div key={m.label} whileTap={springTap}>
                    <ProgressRing current={m.current} goal={m.goal} size={64} strokeWidth={7} color={m.color}>
                      <AnimatedNumber value={m.current} style={{ fontSize: '13px', fontWeight: 700 }} />
                    </ProgressRing>
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['Protein', 'Fat', 'Carbs'].map(l => (
                  <div key={l} style={{ width: 64, textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{l}</div>
                ))}
              </div>
            </motion.div>

            {/* Hourly bar chart card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', marginBottom: '12px' }}>Hourly Intake</div>
              <HourlyBarChart hourlyValues={todayActivity.hourlyCalories || Array(24).fill(0)} color={NEON_PINK} height={70} />
            </motion.div>

            {/* Trends card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <motion.div animate={{ opacity: [1, 0.7, 1], scale: [1, 0.95, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Flame size={16} color={ELECTRIC_LIME} />
                </motion.div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Trends</div>
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', lineHeight: 1.5 }}>
                {currentStreak > 0 ? <>You're on a <AnimatedNumber value={currentStreak} style={{ color: ELECTRIC_LIME, fontWeight: 700 }} />-day daily streak. </> : 'Log today to start a new streak. '}
              </div>
            </motion.div>

            {/* Awards row */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Trophy size={16} color={NEON_PINK} />
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Recent Awards</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {recentBadges.length === 0 ? (
                  <div style={{ gridColumn: 'span 6', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)', textAlign: 'center', padding: '12px 0' }}>No awards yet — keep your streak going</div>
                ) : recentBadges.map(a => (
                  <motion.div key={a.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', borderRadius: '10px', border: `1.5px solid ${a.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${a.primaryColor}1A`, boxShadow: `0 4px 12px ${a.primaryColor}22` }}>
                    {a.symbol}
                    <motion.div 
                      initial={{ x: '-100%', opacity: 0 }} 
                      whileHover={{ x: '100%', opacity: 0.5 }} 
                      transition={{ duration: 0.6, ease: "easeInOut" }} 
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', background: `linear-gradient(90deg, transparent, ${a.primaryColor}88, transparent)`, transform: 'skewX(-20deg)' }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}"""

content = content.replace(dashboard_block_old, dashboard_block_new)


# Replace Detail View Block
detail_block_old = """        {/* ── DETAIL VIEW (7-day strip) ── */}
        {view === 'detail' && (
          <>
            <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {last7Days.map(day => (
                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={36} strokeWidth={4} color={NEON_PINK} />
                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {last7Days.map(day => (
              <div key={day.date} style={{ background: '#1C1C1E', borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={44} strokeWidth={5} color={NEON_PINK} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{day.caloriesConsumed} kcal · {day.proteinConsumed}g protein</div>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: day.complianceScore >= 70 ? ELECTRIC_LIME : 'rgba(235,235,245,0.5)' }}>{day.complianceScore}</div>
              </div>
            ))}
          </>
        )}"""

detail_block_new = """        {/* ── DETAIL VIEW (7-day strip) ── */}
        {view === 'detail' && (
          <motion.div key="detail" variants={containerVariants} initial="hidden" animate="show" exit="exit">
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {last7Days.map(day => (
                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={36} strokeWidth={4} color={NEON_PINK} />
                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {last7Days.map(day => (
              <motion.div key={day.date} variants={itemVariants} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={44} strokeWidth={5} color={NEON_PINK} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{day.caloriesConsumed} kcal · {day.proteinConsumed}g protein</div>
                </div>
                <motion.div animate={{ color: day.complianceScore >= 70 ? ELECTRIC_LIME : 'rgba(235,235,245,0.5)' }} style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{day.complianceScore}</motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}"""

content = content.replace(detail_block_old, detail_block_new)

# Replace Calendar View Block
calendar_block_old = """        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <div style={{ background: '#1C1C1E', borderRadius: '20px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <ChevronLeft size={20} />
              </button>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarDays.map((day, i) => (
                <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {day ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={32} strokeWidth={3} color={day.date === todayStr ? ELECTRIC_LIME : NEON_PINK} />
                      <div style={{ position: 'absolute', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{new Date(day.date).getDate()}</div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}"""

calendar_block_new = """        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <motion.div key="calendar" variants={containerVariants} initial="hidden" animate="show" exit="exit">
          <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <motion.button whileTap={springTap} onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                <ChevronLeft size={20} />
              </motion.button>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <motion.button whileTap={springTap} onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                <ChevronRight size={20} />
              </motion.button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)' }}>{d}</div>
              ))}
            </div>
            <motion.div 
              key={calendarMonthIso}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarDays.map((day, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.01 }} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {day ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {day.date === todayStr && (
                        <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: ELECTRIC_LIME, filter: 'blur(4px)', opacity: 0.4 }} />
                      )}
                      <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={32} strokeWidth={3} color={day.date === todayStr ? ELECTRIC_LIME : NEON_PINK} />
                      <div style={{ position: 'absolute', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{new Date(day.date).getDate()}</div>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          </motion.div>
        )}
        </AnimatePresence>"""

content = content.replace(calendar_block_old, calendar_block_new)

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
