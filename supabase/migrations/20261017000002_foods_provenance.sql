-- ============================================================================
-- Phase 6.2 patch — provenance, review status, and oil accounting
-- ============================================================================
-- Adds four columns to `foods`:
--   provenance      — how the nutrition values were obtained
--   review_status   — verified vs provisional
--   oil_included    — TRUE when kcal/fat already include cooking oil
--   oil_per_100g    — estimated oil mass per 100 g of cooked dish (optional)
--
-- Rationale for oil_included:
--   Most Indian cooked dishes are made with oil. If a curated entry's kcal
--   already reflects that oil, a user who logs "1 tbsp oil" separately must
--   not have it counted twice. The resolver reads oil_included and skips the
--   added-oil item when it's TRUE, or flags it for confirmation.
-- ============================================================================

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS provenance TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'provisional',
  ADD COLUMN IF NOT EXISTS oil_included BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS oil_per_100g NUMERIC(5,2);

ALTER TABLE public.foods
  DROP CONSTRAINT IF EXISTS foods_provenance_check;
ALTER TABLE public.foods
  ADD CONSTRAINT foods_provenance_check
  CHECK (provenance IS NULL OR provenance IN
    ('lab_measured', 'recipe_calculated', 'published_reference', 'undocumented'));

ALTER TABLE public.foods
  DROP CONSTRAINT IF EXISTS foods_review_status_check;
ALTER TABLE public.foods
  ADD CONSTRAINT foods_review_status_check
  CHECK (review_status IN ('verified', 'provisional', 'rejected'));

COMMENT ON COLUMN public.foods.provenance IS
  'How the nutrition values were obtained. NULL = unknown (treat as undocumented).';
COMMENT ON COLUMN public.foods.review_status IS
  'verified = manually reviewed against a source. provisional = imported or
   estimated and not yet reviewed. rejected = known bad, do not serve.';
COMMENT ON COLUMN public.foods.oil_included IS
  'TRUE when the per-100g kcal/fat values already include cooking oil. The
   resolver will skip a separately-logged oil item when this is TRUE.';
COMMENT ON COLUMN public.foods.oil_per_100g IS
  'Estimated oil mass (g) per 100 g of cooked dish. NULL = unknown.';