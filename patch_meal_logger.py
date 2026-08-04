import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Add CustomMealModal state
content = content.replace(
    "const [failedMealError, setFailedMealError] = useState<string | null>(null);",
    "const [failedMealError, setFailedMealError] = useState<string | null>(null);\n  const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);"
)

# Add custom meal save handler
# Let's find confirmMealMutation and add handleCustomMealSave
# Wait, handleCustomMealSave can just use addMealMutation directly
# Add it near handleSend

save_handler = """
  const handleCustomMealSave = (mealData: any) => {
    addMealMutation.mutate(mealData);
  };
"""

content = content.replace(
    "const handleDeleteMeal = (id: string) => {",
    save_handler + "\n  const handleDeleteMeal = (id: string) => {"
)

# Add button in the input row
# Find:
#                 <motion.button
#                   whileHover={{ scale: 1.08 }}

input_row = """
              {/* Input row */}
              <div className="glass-strong border-t border-[rgba(255,255,255,0.06)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-col gap-3">
                <div className="flex gap-3 items-center">
"""

button_row = """                </div>
                <button
                  onClick={() => setIsCustomMealModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 text-[rgba(255,255,255,0.5)] hover:text-white text-[13px] font-medium transition-colors w-fit mx-auto pb-1"
                >
                  <Plus size={14} />
                  Create Custom Meal
                </button>
              </div>"""

content = content.replace(
    """              {/* Input row */}
              <div className="glass-strong border-t border-[rgba(255,255,255,0.06)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex gap-3 items-center">""",
    input_row
)

content = content.replace(
    """                </motion.button>
              </div>""",
    """                </motion.button>""" + "\n" + button_row
)

# Add CustomMealModal to the end of the return statement
modal_comp = """
        )}
        </AnimatePresence>,
        document.body
      )}
      
      <CustomMealModal
        isOpen={isCustomMealModalOpen}
        onClose={() => setIsCustomMealModalOpen(false)}
        onSave={handleCustomMealSave}
        defaultSlot={selectedMealSlot || undefined}
      />
    </>
  );
"""

content = content.replace(
    """        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );""",
    modal_comp
)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

