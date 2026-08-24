-- =========================================================
-- Migration: Add Making Charges & Stone Cost to Products Table
-- =========================================================

-- 1. Add making charge, stone cost, and image_url columns to public.products
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS making_charge_type TEXT DEFAULT 'PERCENTAGE',
ADD COLUMN IF NOT EXISTS making_charge_value NUMERIC(12, 2) DEFAULT 12.00,
ADD COLUMN IF NOT EXISTS stone_price NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS stone_details TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 2. Add image_url to legacy manufacturer_products table if missing
ALTER TABLE IF EXISTS public.manufacturer_products
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 3. Add notes column to public.gold_prices if missing
ALTER TABLE IF EXISTS public.gold_prices
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 2. Create product_stones table for detailed gemstone breakdown per product
CREATE TABLE IF NOT EXISTS public.product_stones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stone_type TEXT NOT NULL, -- e.g., Diamond, Ruby, Emerald, CZ, Pearl
  carat_weight NUMERIC(8, 3) DEFAULT 0.0,
  stone_count INT DEFAULT 1,
  price_per_carat NUMERIC(12, 2) DEFAULT 0.0,
  total_stone_price NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for product_stones
CREATE INDEX IF NOT EXISTS idx_product_stones_product_id ON public.product_stones(product_id);
