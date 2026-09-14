-- ============================================================
-- CJP Version 2.0 Migration — Add retailer_id to orders table
-- ============================================================

-- 1. Safely add retailer_id column to orders table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'orders' 
          AND column_name = 'retailer_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN retailer_id UUID REFERENCES public.retailers(id);
    END IF;
END $$;

-- 2. Create index on orders(retailer_id)
CREATE INDEX IF NOT EXISTS idx_orders_retailer ON public.orders(retailer_id);

-- 3. Backfill retailer_id on legacy orders from order_items -> retailer_products or products
UPDATE public.orders o
SET retailer_id = COALESCE(
    (SELECT rp.retailer_id FROM public.order_items oi JOIN public.retailer_products rp ON rp.id = oi.product_id WHERE oi.order_id = o.id LIMIT 1),
    (SELECT p.retailer_id FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id WHERE oi.order_id = o.id LIMIT 1),
    (SELECT id FROM public.retailers LIMIT 1)
)
WHERE o.retailer_id IS NULL;
