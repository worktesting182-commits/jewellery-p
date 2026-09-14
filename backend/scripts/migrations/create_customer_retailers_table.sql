-- ============================================================
-- CJP Version 2.0 Migration — Step 3.2 & 3.3: customer_retailers Table
-- ============================================================

-- 1. Create customer_retailers junction table if not exists
CREATE TABLE IF NOT EXISTS public.customer_retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    retailer_id UUID NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, REVOKED, BLOCKED
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_customer_retailer UNIQUE (customer_id, retailer_id)
);

-- 2. Create performance indexes for multi-tenant query resolution
CREATE INDEX IF NOT EXISTS idx_cust_ret_customer ON public.customer_retailers(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_ret_retailer ON public.customer_retailers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_cust_ret_lookup ON public.customer_retailers(customer_id, retailer_id, status);

-- 3. Data Migration (Step 3.3): Backfill customer_retailers without removing legacy columns
-- Backfill from legacy orders if available
INSERT INTO public.customer_retailers (customer_id, retailer_id, status, joined_at)
SELECT DISTINCT o.customer_id, r.id, 'ACTIVE', NOW()
FROM public.orders o
CROSS JOIN public.retailers r
WHERE o.customer_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.customer_retailers cr 
      WHERE cr.customer_id = o.customer_id AND cr.retailer_id = r.id
  )
ON CONFLICT (customer_id, retailer_id) DO NOTHING;

-- Preserve legacy customer.retailer_id column if present (DO NOT DROP LEGACY COLUMNS)
