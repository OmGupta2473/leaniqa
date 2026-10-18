import { AlertTriangle } from 'lucide-react';

export interface AmbiguityIndicatorProps {
  wasAmbiguous: boolean;
}

/**
 * Soft caution indicator for meals resolved with uncertainty.
 *
 * Renders when `wasAmbiguous` is true. Carries no behavior of its own —
 * no fetching, no interactions. The consuming page wraps this in a
 * motion.div for enter/exit animation and imports ambiguityIndicator.css
 * alongside (per standards §1.7: "imported by the page so it code-splits").
 *
 * Accessibility: role="status" + aria-live="polite" announces the message
 * once when it appears. The icon is decorative (aria-hidden) — the text
 * carries the semantic. No focusable elements; no hit-area needed.
 */
export function AmbiguityIndicator({ wasAmbiguous }: AmbiguityIndicatorProps) {
  if (!wasAmbiguous) return null;

  return (
    <div className="ai-block" role="status" aria-live="polite">
      <AlertTriangle
        className="ai-icon"
        size={16}
        aria-hidden="true"
        strokeWidth={2}
      />
      <span className="ai-caption">
        This meal may match another food in our database. Please check the details before logging.
      </span>
    </div>
  );
}