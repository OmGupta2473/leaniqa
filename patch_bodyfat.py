import re

with open('src/features/goal/components/BodyFatSelector.tsx', 'r') as f:
    content = f.read()

# Replace the inner AnimatePresence with createPortal
old_func_start = """function BodyFatPreviewModal({ option, gender, onClose, onSelect }: BodyFatPreviewModalProps) {
  if (!option) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">"""

new_func_start = """function BodyFatPreviewModal({ option, gender, onClose, onSelect }: BodyFatPreviewModalProps) {
  if (!option) return null;
  
  return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">"""

content = content.replace(old_func_start, new_func_start)

old_func_end = """        </motion.div>
      </div>
    </AnimatePresence>
  );
}"""

new_func_end = """        </motion.div>
      </div>,
      document.body
  );
}"""

content = content.replace(old_func_end, new_func_end)

# Add AnimatePresence to the parent
old_parent = """      {previewOption && (
        <BodyFatPreviewModal
          option={previewOption}
          gender={gender}
          onClose={() => setPreviewOption(null)}
          onSelect={() => onChange(previewOption.mid)}
        />
      )}"""

new_parent = """      <AnimatePresence>
        {previewOption && (
          <BodyFatPreviewModal
            option={previewOption}
            gender={gender}
            onClose={() => setPreviewOption(null)}
            onSelect={() => onChange(previewOption.mid)}
          />
        )}
      </AnimatePresence>"""

content = content.replace(old_parent, new_parent)

with open('src/features/goal/components/BodyFatSelector.tsx', 'w') as f:
    f.write(content)

print("Patched.")
