import { motion } from "motion/react";
import { AlertTriangle, Check, Pencil } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { AiMealUiState } from "../utils/mealInterpretationUi";
import { LogInstructions } from "./LogInstructions";

interface AiMealPreviewCardProps {
  state: AiMealUiState;
  creditsConsumed: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export function AiMealPreviewCard({
  state,
  creditsConsumed,
  isPending,
  onConfirm,
  onEdit,
  onCancel,
}: AiMealPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start overflow-hidden"
    >
      {/* Header */}
      <div className="p-[16px_20px_12px] border-b border-[rgba(255,255,255,0.06)]">
        <div className="text-[15px] font-semibold text-white leading-snug mb-2">
          {state.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[11px] text-[rgba(255,255,255,0.65)]">
            {styleEmoji(state.mealStyle)} {styleLabel(state.mealStyle)}
          </span>
          <ConfidencePill confidence={state.confidence} />
        </div>
      </div>

      {/* Section 1 — Assumptions */}
      {state.assumptions.length > 0 && (
        <div className="p-[14px_20px] border-b border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.45)] mb-2">
            Assumptions
          </div>
          <ul className="space-y-1.5">
            {state.assumptions.map((a, i) => (
              <li
                key={i}
                className="flex gap-2 text-[12.5px] text-[rgba(255,255,255,0.75)] leading-snug"
              >
                <span className="text-[rgba(255,255,255,0.3)] shrink-0 select-none">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 2 — Item breakdown */}
      {state.showItemTable ? (
        <ItemTable items={state.items} />
      ) : state.items.length === 1 ? (
        <SingleItemRow item={state.items[0]} />
      ) : null}

      {/* Section 3 — Totals + actions */}
      <div className="p-[14px_20px]">
        {state.needsReview && (
          <div className="mb-3 rounded-xl border border-[rgba(255,176,32,0.3)] bg-[rgba(255,176,32,0.08)] p-2.5">
            <div className="flex items-start gap-2 text-[12px] text-[#FFB020]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                AI is {state.confidence}% confident. Review the totals below —
                edit if needed, or confirm to log.
              </span>
            </div>
            {state.clarifyingQuestions.length > 0 && (
              <ul className="mt-2 space-y-1 pl-6">
                {state.clarifyingQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="text-[11.5px] text-[rgba(255,255,255,0.6)] leading-snug"
                  >
                    • {q}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          <MacroTile label="kcal" value={Math.round(state.totals.calories)} accent="#FF4D1C" />
          <MacroTile label="pro" value={state.totals.protein} unit="g" accent="#D4FF00" />
          <MacroTile label="carb" value={state.totals.carbs} unit="g" accent="#378ADD" />
          <MacroTile label="fat" value={state.totals.fat} unit="g" accent="#FFB020" />
        </div>

        {creditsConsumed && (
          <div className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.4)]">
            1 credit used — Cancel will refund it
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 rounded-[12px] text-[13px] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={isPending}
            className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 rounded-[12px] text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-[#D4FF00] text-black font-bold py-2 rounded-[12px] text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isPending ? (
              "Logging…"
            ) : (
              <>
                <Check size={12} strokeWidth={3} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 4 — Logging instructions */}
      <LogInstructions />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ItemTable({ items }: { items: AiMealUiState["items"] }) {
  return (
    <div className="p-[14px_20px] border-b border-[rgba(255,255,255,0.06)]">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.45)] mb-2">
        Items
      </div>
      <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,auto)] gap-x-2 bg-[rgba(255,255,255,0.04)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">
          <span>Item</span>
          <span className="text-right">Cal</span>
          <span className="text-right">Pro</span>
          <span className="text-right">Carb</span>
          <span className="text-right">Fat</span>
        </div>
        {items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,1fr)_repeat(4,auto)] gap-x-2 border-t border-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[12px] items-start"
          >
            <div className="min-w-0">
              <div className="truncate text-white">{item.label}</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.35)]">
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""} · {item.grams}g
                {item.oil_included ? " · oil incl." : ""}
              </div>
            </div>
            <span className="tabular-nums text-white text-right">{Math.round(item.calories)}</span>
            <span className="tabular-nums text-white text-right">{item.protein}</span>
            <span className="tabular-nums text-white text-right">{item.carbs}</span>
            <span className="tabular-nums text-white text-right">{item.fat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SingleItemRow({ item }: { item: AiMealUiState["items"][number] }) {
  return (
    <div className="p-[14px_20px] border-b border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">{item.label}</div>
          <div className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5">
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""} · {item.grams}g
            {item.oil_included ? " · oil incl." : ""}
          </div>
        </div>
        <div className="text-[12px] font-bold text-[rgba(255,255,255,0.75)] tabular-nums shrink-0">
          {Math.round(item.calories)} kcal
        </div>
      </div>
    </div>
  );
}

function MacroTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-2 py-2 text-center">
      <div
        className="text-[16px] font-bold tabular-nums leading-none"
        style={{ color: accent }}
      >
        {value}
        {unit && <span className="text-[10px] ml-0.5 opacity-70">{unit}</span>}
      </div>
      <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: `${accent}99` }}>
        {label}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const tone = confidence >= 80 ? "good" : confidence >= 60 ? "warn" : "bad";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        tone === "good" && "bg-[rgba(212,255,0,0.10)] text-[#D4FF00]",
        tone === "warn" && "bg-[rgba(255,176,32,0.10)] text-[#FFB020]",
        tone === "bad" && "bg-[rgba(255,77,28,0.10)] text-[#FF4D1C]",
      )}
    >
      {confidence}% confidence
    </span>
  );
}

function styleEmoji(style: string): string {
  switch (style) {
    case "homemade":
      return "🏠";
    case "street-side":
      return "🛺";
    case "restaurant":
      return "🍽️";
    default:
      return "🥣";
  }
}

function styleLabel(style: string): string {
  switch (style) {
    case "homemade":
      return "Homemade";
    case "street-side":
      return "Street-side";
    case "restaurant":
      return "Restaurant";
    default:
      return "Other";
  }
}