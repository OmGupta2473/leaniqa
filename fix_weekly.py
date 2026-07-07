import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    text = f.read()

# Replace the specific closing divs for the items
text = text.replace("""              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['Protein', 'Fat', 'Carbs'].map(l => (
                  <div key={l} style={{ width: 64, textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{l}</div>
                ))}
              </div>
            </div>""", """              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['Protein', 'Fat', 'Carbs'].map(l => (
                  <div key={l} style={{ width: 64, textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{l}</div>
                ))}
              </div>
            </motion.div>""")

text = text.replace("""              <HourlyBarChart hourlyValues={todayActivity.hourlyCalories || Array(24).fill(0)} color={NEON_PINK} height={70} />
            </div>""", """              <HourlyBarChart hourlyValues={todayActivity.hourlyCalories || Array(24).fill(0)} color={NEON_PINK} height={70} />
            </motion.div>""")

text = text.replace("""              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', lineHeight: 1.5 }}>
                {currentStreak > 0 ? `You're on a ${currentStreak}-day daily streak. ` : 'Log today to start a new streak. '}
              </div>
            </div>""", """              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', lineHeight: 1.5 }}>
                {currentStreak > 0 ? `You're on a ${currentStreak}-day daily streak. ` : 'Log today to start a new streak. '}
              </div>
            </motion.div>""")

text = text.replace("""                  <div key={a.id} style={{ aspectRatio: '1', borderRadius: '10px', border: `1.5px solid ${a.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${a.primaryColor}1A` }}>
                    {a.symbol}
                  </div>
                ))}
              </div>
            </div>""", """                  <div key={a.id} style={{ aspectRatio: '1', borderRadius: '10px', border: `1.5px solid ${a.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${a.primaryColor}1A` }}>
                    {a.symbol}
                  </div>
                ))}
              </div>
            </motion.div>""")

text = text.replace("""                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>""", """                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>""")

text = text.replace("""                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{day.caloriesConsumed} kcal · {day.proteinConsumed}g protein</div>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: day.complianceScore >= 70 ? ELECTRIC_LIME : 'rgba(235,235,245,0.5)' }}>{day.complianceScore}</div>
              </div>""", """                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{day.caloriesConsumed} kcal · {day.proteinConsumed}g protein</div>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: day.complianceScore >= 70 ? ELECTRIC_LIME : 'rgba(235,235,245,0.5)' }}>{day.complianceScore}</div>
              </motion.div>""")

text = text.replace("""                </div>
              ))}
            </div>
          </div>""", """                </div>
              ))}
            </div>
          </motion.div>""")

text = text.replace("<>            <motion.div", "<>            <motion.div") # Fix fragment error by removing it, but wait, it's wrapped in motion.div already
# Let's remove the <> and </> for detail view since we wrapped it in motion.div
text = text.replace("""          >          <>            <motion.div""", """          >            <motion.div""")
text = text.replace("""              </motion.div>            ))}          </>        )}""", """              </motion.div>            ))}          </motion.div>        )}""")

# Same for dashboard view:
# wait, dashboard has <> and </>?
text = text.replace("""          >          <>            {/* Ring summary card */}""", """          >            {/* Ring summary card */}""")
text = text.replace("""            </motion.div>          </>        )}""", """            </motion.div>          </motion.div>        )}""")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(text)
