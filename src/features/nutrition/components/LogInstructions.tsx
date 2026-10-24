import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { useNutritionStore } from "../store/nutritionStore";

const TIPS = [
  'Include quantity/weight — "150g rice", "2 rotis"',
  'Say if you used oil/ghee — "1 tsp ghee"',
  "Say if weighed raw or cooked",
  "Say source — homemade / street / restaurant",
];

export function LogInstructions() {
  const expanded = useNutritionStore((s) => s.instructionsExpanded);
  const setExpanded = useNutritionStore((s) => s.setInstructionsExpanded);

  return (
    <div className="border-t border-[rgba(255,255,255,0.06)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.6)]">
          <Lightbulb size={13} className="text-[#D4FF00]" />
          {expanded ? "Better prompts" : "Better prompts →"}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-[rgba(255,255,255,0.4)]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5 pb-4 space-y-1.5"
          >
            {TIPS.map((t, i) => (
              <li
                key={i}
                className="text-[12px] text-[rgba(255,255,255,0.6)] leading-snug flex gap-2"
              >
                <span className="text-[rgba(255,255,255,0.3)] select-none">•</span>
                <span>{t}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}