import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

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
              <button
                key={v}
                onClick={() => setView(v)}
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
              </button>
            ))}
          </div>"""

content = content.replace(old_segmented, new_segmented)

# Container animation wrap
old_views = """        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && ("""
new_views = """        <AnimatePresence mode="wait">
        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >"""
content = content.replace(old_views, new_views)

# End dashboard
content = content.replace("""            </div>
          </>
        )}""", """            </div>
          </motion.div>
        )}""")


# Detail view
old_detail = """        {/* ── DETAIL VIEW (7-day strip) ── */}
        {view === 'detail' && ("""
new_detail = """        {/* ── DETAIL VIEW (7-day strip) ── */}
        {view === 'detail' && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >"""
content = content.replace(old_detail, new_detail)

# End detail
content = content.replace("""              </div>
            ))}
          </>
        )}""", """              </div>
            ))}
          </motion.div>
        )}""")


# Calendar view
old_calendar = """        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && ("""
new_calendar = """        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >"""
content = content.replace(old_calendar, new_calendar)

# End calendar
content = content.replace("""            </div>
          </div>
        )}""", """            </div>
          </div>
          </motion.div>
        )}
        </AnimatePresence>""")


with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
