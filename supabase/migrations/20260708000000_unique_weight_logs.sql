-- Remove duplicates before adding unique constraint
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id, date ORDER BY updated_at DESC, id DESC) as rn
    FROM public.weight_logs
)
DELETE FROM public.weight_logs WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE public.weight_logs DROP CONSTRAINT IF EXISTS weight_logs_user_id_date_key;
ALTER TABLE public.weight_logs ADD CONSTRAINT weight_logs_user_id_date_key UNIQUE (user_id, date);
