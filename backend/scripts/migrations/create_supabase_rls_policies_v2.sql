-- ============================================================
-- CJP Version 2.0 — Supabase Row Level Security (RLS) Policies
-- ============================================================

-- 1. Enable RLS on core retailer-scoped tables
ALTER TABLE IF EXISTS public.customer_retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.retailer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- POLICIES FOR customer_retailers
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Customers view own memberships" ON public.customer_retailers;
CREATE POLICY "Customers view own memberships"
ON public.customer_retailers FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Customers insert own memberships" ON public.customer_retailers;
CREATE POLICY "Customers insert own memberships"
ON public.customer_retailers FOR INSERT
TO authenticated
WITH CHECK (
    customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
);

-- ------------------------------------------------------------
-- POLICIES FOR retailers
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public & Customers view active retailers" ON public.retailers;
CREATE POLICY "Public & Customers view active retailers"
ON public.retailers FOR SELECT
TO authenticated, anon
USING (true);

-- ------------------------------------------------------------
-- POLICIES FOR retailer_products (PRODUCT ISOLATION BY MEMBERSHIP)
-- Core Rule: Customer can access retailer products ONLY IF active customer_retailers membership exists
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Customers access products for authorized retailers" ON public.retailer_products;
CREATE POLICY "Customers access products for authorized retailers"
ON public.retailer_products FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customer_retailers cr
        JOIN public.customers c ON c.id = cr.customer_id
        WHERE c.user_id = auth.uid()
          AND cr.retailer_id = retailer_products.retailer_id
          AND cr.status = 'ACTIVE'
    )
);

-- ------------------------------------------------------------
-- POLICIES FOR carts (CART ISOLATION BY MEMBERSHIP)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Customers access authorized retailer carts" ON public.carts;
CREATE POLICY "Customers access authorized retailer carts"
ON public.carts FOR ALL
TO authenticated
USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.customer_retailers cr
        WHERE cr.customer_id = carts.customer_id
          AND cr.retailer_id = carts.retailer_id
          AND cr.status = 'ACTIVE'
    )
);

-- ------------------------------------------------------------
-- POLICIES FOR orders (ORDER ISOLATION)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
