-- The initial barcode_cache check constraint allowed only
-- ('openfoodfacts','fatsecret','nutritionix','manual'). The multi-source
-- chain adds 'edamam'. Drop and recreate rather than editing in place so
-- this migration is idempotent.
ALTER TABLE public.barcode_cache
  DROP CONSTRAINT IF EXISTS barcode_cache_source_check;

ALTER TABLE public.barcode_cache
  ADD CONSTRAINT barcode_cache_source_check
  CHECK (source IN ('openfoodfacts', 'edamam', 'fatsecret', 'nutritionix', 'manual'));