import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

ui_block = """                  {failedMealError && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,77,28,0.05)] border-[0.5px] border-[rgba(255,77,28,0.2)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="mb-3 text-[rgba(255,255,255,0.9)]">
                        <strong>Error:</strong> {failedMealError}
                      </div>
                      <button 
                        onClick={() => {
                          setFailedMealError(null);
                          setFailedMealText(null);
                          setRetryCount(0);
                        }}
                        className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                  {failedMealText && !loading && ("""

content = content.replace("{failedMealText && !loading && (", ui_block)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
