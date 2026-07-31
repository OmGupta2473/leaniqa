import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

new_renders = """                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
                    >
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                    </motion.div>
                  )}
                  {pendingMeal && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="font-semibold text-white mb-2">Here is the estimated nutrition. Would you like to log this?</div>
                      <div className="flex gap-[6px] flex-wrap mb-[12px]">
                        <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{pendingMeal.data.calories} kcal</span>
                        <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{pendingMeal.data.protein}g pro</span>
                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.fat}g fat</span>
                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.carbs}g carb</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => confirmMealMutation.mutate(pendingMeal)}
                          disabled={confirmMealMutation.isPending}
                          className="flex-1 bg-[#D4FF00] text-black font-bold py-2 rounded-[12px] text-[13px]"
                        >
                          {confirmMealMutation.isPending ? 'Logging...' : 'Confirm'}
                        </button>
                        <button 
                          onClick={() => setPendingMeal(null)}
                          disabled={confirmMealMutation.isPending}
                          className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 rounded-[12px] text-[13px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {failedMealText && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,77,28,0.05)] border-[0.5px] border-[rgba(255,77,28,0.2)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="mb-3 text-[rgba(255,255,255,0.9)]">We couldn't confidently identify this meal. Nothing has been logged. Please try again.</div>
                      <button 
                        onClick={() => {
                          const text = failedMealText;
                          setFailedMealText(null);
                          setLoading(true);
                          parseMealMutation.mutate(text);
                        }}
                        className="bg-[#FF4D1C] hover:bg-[#FF4D1C]/80 text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                      >
                        Retry
                      </button>
                    </motion.div>
                  )}"""

content = content.replace("""                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
                    >
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                    </motion.div>
                  )}""", new_renders)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

