-- ============================================================
-- CJP Version 2.0 Migration — Step 4.2: Duplicate-Safe Migration
-- ============================================================

-- Safely backfill customer_retailers handling all edge cases:
-- 1. NULL retailer_id -> Filtered via IS NOT NULL
-- 2. Invalid retailer -> Filtered via JOIN public.retailers r ON r.id = src.retailer_id
-- 3. Inactive retailer -> Filtered via r.status = 'ACTIVE'
-- 4. Duplicate relationships -> Handled via ON CONFLICT (customer_id, retailer_id) DO NOTHING

INSERT INTO public.customer_retailers (customer_id, retailer_id, status, joined_at)
SELECT DISTINCT 
    c.id AS customer_id,
    r.id AS retailer_id,
    'ACTIVE' AS status,
    NOW() AS joined_at
FROM public.customers c
INNER JOIN public.orders o ON o.customer_id = c.id
INNER JOIN public.retailers r ON r.id = o.retailer_id
WHERE o.retailer_id IS NOT NULL
  AND r.status = 'ACTIVE'
ON CONFLICT (customer_id, retailer_id) DO NOTHING;
