-- Migration: Update products table model to support both Manufacturer and Retailer-owned products

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  retailer_id UUID NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  material TEXT,
  purity TEXT,
  weight NUMERIC,
  manufacturer_price NUMERIC,
  retailer_price NUMERIC,
  product_source TEXT NOT NULL CHECK (product_source IN ('MANUFACTURER', 'RETAILER')),
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by manufacturer or retailer or source
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON public.products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_retailer_id ON public.products(retailer_id);
CREATE INDEX IF NOT EXISTS idx_products_product_source ON public.products(product_source);
