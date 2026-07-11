const fs = require('fs');

const path = 'src/features/nutrition/pages/MealLoggerPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// I will now replace `MealSlotRow`
code = code.replace(
  /function MealSlotRow\(\{[\s\S]*?\}\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/,
  `function MealSlotRow({ slot, icon, label, timeRange, meals, onDelete }: { slot: string; icon: React.ReactNode; label: string; timeRange: string; meals: any[], onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);
  return (
    <div className="card-base mb-3 overflow-hidden">
      <div className="p-4 flex items-center justify-between select-none cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="text-[rgba(255,255,255,0.7)]">{icon}</div>
          <div>
            <div className="text-[14px] font-semibold text-white leading-none">{label}</div>
            <div className="text-[11px] text-[rgba(255,255,255,0.4)] mt-1">{timeRange}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-[14px] font-bold text-white leading-none">{kcal} kcal</div>
            <div className="text-[11px] font-semibold text-[#378ADD] mt-1">{pro}g protein</div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-[rgba(255,255,255,0.4)]" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-[rgba(255,255,255,0.06)] pt-3">
              {meals.length > 0 ? meals.map((m, i) => (
                <div key={m.id || i} className="flex items-center justify-between group">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-[13px] text-[rgba(255,255,255,0.8)] capitalize truncate">{m.meal_text}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold">{m.calories} KCAL</span>
                    <span className="text-[10px] badge-lime px-2 py-0.5 font-bold rounded-full">{m.protein}G PRO</span>
                    {m.id && !m.id.toString().startsWith('opt-') && (
                      <button onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete Meal? This action cannot be undone.")) {
                            onDelete(m.id);
                          }
                      }} className="w-6 h-6 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,77,28,0.2)] hover:text-[#FF4D1C] transition-colors ml-1">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-[12px] text-[rgba(255,255,255,0.25)] italic">Nothing logged yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`
);

// I will now replace the Modal content (from <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' ... down to end of modal)
// It's easier to just do it via standard replace if possible. Let's see.

// Add ArrowRight and ChevronDown to imports
code = code.replace(/import \{([\s\S]*?)Plus, X, ChevronLeft, ChevronRight,([\s\S]*?)\} from "lucide-react";/, 'import { $1 Plus, X, ChevronLeft, ChevronRight, ArrowRight, ChevronDown, $2 } from "lucide-react";');

// Replace the modal header + Meal slot selector + AI status indicator + Chat messages + Input row
// The modal content starts with `{/* Modal header */}`
code = code.replace(/\{\/\* Modal header \*\/\}[\s\S]*?\{\/\* Input row \*\/\}[\s\S]*?<\/div>\s*<\/motion.div>\s*<\/motion.div>/, `
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Log a meal</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Type naturally, I handle the rest</div>
                </div>
                <button onClick={() => setModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Meal slot selector */}
              <div className="px-5 pt-3">
                <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl p-1.5 flex gap-1 relative">
                  {([['breakfast', Sunrise, 'Breakfast', '6 AM - 12 PM'], ['lunch', Sun, 'Lunch', '12 PM - 6 PM'], ['dinner', Moon, 'Dinner', '6 PM - 10 PM']] as const).map(([slot, Icon, label, time]) => {
                    const isActive = selectedMealSlot === slot;
                    return (
                      <div
                        key={slot}
                        onClick={() => setSelectedMealSlot(slot as any)}
                        className={cn(
                          "flex-1 flex flex-col items-center py-2.5 rounded-xl cursor-pointer transition-colors duration-200 relative z-10",
                          isActive ? "text-white font-medium" : "text-[rgba(255,255,255,0.4)] bg-transparent"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="slotActive"
                            className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-xl -z-10"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon size={14} className="mb-1" />
                        <div className="text-[13px]">{label}</div>
                        <div className="text-[9px] text-[rgba(255,255,255,0.32)] font-normal">{time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI status indicator */}
              <div className="px-5 pt-3 flex items-center justify-center">
                {aiStatus === 'offline' && (
                  <div className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.4)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
                    <span>AI Offline — Using Database</span>
                  </div>
                )}
                {aiStatus === 'online' && (
                  <div className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.4)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_#D4FF00] animate-pulse-glow" style={{ animation: 'pulseGlow 2s infinite ease-in-out' }} />
                    <style>{'@keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }'}</style>
                    <span>Gemini AI Active</span>
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                <AnimatePresence>
                  {chat.map((msg, i) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
                        className={cn(
                          "p-[12px_16px] text-[14px] leading-relaxed relative",
                          isUser 
                            ? "bg-[rgba(212,255,0,0.12)] border-[0.5px] border-[rgba(212,255,0,0.2)] text-white rounded-2xl rounded-tr-sm max-w-[85%] self-end" 
                            : "bg-[rgba(255,255,255,0.04)] border-[0.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.85)] rounded-2xl rounded-tl-sm max-w-[90%] self-start"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {msg.data && (
                          <div className="flex gap-[6px] flex-wrap mt-[8px]">
                            <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{msg.data.calories} kcal</span>
                            <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{msg.data.protein}g pro</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)] px-2 py-0.5 rounded-full font-semibold">{msg.data.fat}g fat</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>
                          </div>
                        )}
                        {msg.data?.coaching_tip && (
                          <div className="mt-[12px] border-l-[3px] border-[#D4FF00]/40 bg-[rgba(212,255,0,0.05)] p-3 rounded-r-xl italic text-[13px] flex gap-[8px] items-start">
                            <Lightbulb size={16} className="text-[#D4FF00] mt-0.5 shrink-0" />
                            <div className="text-[rgba(235,235,245,0.75)]">{msg.data.coaching_tip}</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.04)] border-[0.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.85)] rounded-2xl rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
                    >
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input row */}
              <div className="glass-strong border-t border-[rgba(255,255,255,0.06)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex gap-3 items-center">
                <input
                  className="input-apple flex-1 text-[16px] placeholder:text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)]"
                  style={{ borderRadius: '14px', border: '0.5px solid rgba(255,255,255,0.15)', padding: '12px 16px' }}
                  type="text"
                  placeholder={selectedMealSlot ? "e.g. 2 boiled eggs and chai" : "Select breakfast / lunch / dinner"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  onFocus={(e) => {
                    const target = e.target;
                    setTimeout(() => {
                      target.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 300);
                  }}
                  disabled={loading || !selectedMealSlot}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  disabled={loading || !selectedMealSlot || !input.trim()}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00' }}
                >
                  <ArrowRight size={18} strokeWidth={2} color="#0A0A0A" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>`);

fs.writeFileSync(path, code);
