with open('src/features/goal/components/BodyFatSelector.tsx', 'r') as f:
    c = f.read()

# Fix BodyFatPreviewModal returning createPortal
old_func_start = """function BodyFatPreviewModal({ option, gender, onClose, onSelect }: BodyFatPreviewModalProps) {
  if (!option) return null;
  
  return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">"""

new_func_start = """function BodyFatPreviewModal({ option, gender, onClose, onSelect }: BodyFatPreviewModalProps) {
  if (!option) return null;
  
  return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">"""
c = c.replace(old_func_start, new_func_start)

old_func_end = """        </motion.div>
      </div>,
      document.body
  );
}"""

new_func_end = """        </motion.div>
      </div>
  );
}"""
c = c.replace(old_func_end, new_func_end)

# Fix parent rendering
old_parent = """      <AnimatePresence>
        {previewOption && (
          <BodyFatPreviewModal
            option={previewOption}
            gender={gender}
            onClose={() => setPreviewOption(null)}
            onSelect={() => onChange(previewOption.mid)}
          />
        )}
      </AnimatePresence>"""

new_parent = """      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewOption && (
            <BodyFatPreviewModal
              option={previewOption}
              gender={gender}
              onClose={() => setPreviewOption(null)}
              onSelect={() => onChange(previewOption.mid)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}"""
c = c.replace(old_parent, new_parent)

with open('src/features/goal/components/BodyFatSelector.tsx', 'w') as f:
    f.write(c)

print("Fixed BodyFatSelector")
