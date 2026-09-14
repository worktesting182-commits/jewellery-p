-- ============================================================
-- CJP Version 2.0 Migration — Step 3.4: Add retailer_id to carts
-- ============================================================

-- 1. Safely add retailer_id column to carts table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'carts' 
          AND column_name = 'retailer_id'
    ) THEN
        ALTER TABLE public.carts ADD COLUMN retailer_id UUID REFERENCES public.retailers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create index on (customer_id, retailer_id) for multi-tenant cart isolation
CREATE INDEX IF NOT EXISTS idx_carts_customer_retailer ON public.carts(customer_id, retailer_id);

-- 3. Backfill retailer_id on legacy cart items from retailer_products or products
UPDATE public.carts c
SET retailer_id = COALESCE(
    (SELECT rp.retailer_id FROM public.retailer_products rp WHERE rp.id = c.product_id LIMIT 1),
    (SELECT p.retailer_id FROM public.products p WHERE p.id = c.product_id LIMIT 1),
    (SELECT id FROM public.retailers LIMIT 1)
)
WHERE c.retailer_id IS NULL;
