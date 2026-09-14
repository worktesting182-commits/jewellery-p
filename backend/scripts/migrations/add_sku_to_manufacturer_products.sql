-- CJP Version 2.0 - Add SKU Column to manufacturer_products Table
-- Ensures manufacturer product ownership and SKU identification

-- 1. Add sku column to manufacturer_products if it does not already exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'manufacturer_products' 
          AND column_name = 'sku'
    ) THEN
        ALTER TABLE manufacturer_products ADD COLUMN sku VARCHAR(100);
    END IF;
END $$;

-- 2. Add composite index for SKU lookups scoped by manufacturer_id
CREATE INDEX IF NOT EXISTS idx_manufacturer_products_mfg_sku 
ON manufacturer_products(manufacturer_id, sku);

-- 3. Add UNIQUE constraint for SKU per manufacturer (if SKU is provided)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_manufacturer_sku'
    ) THEN
        ALTER TABLE manufacturer_products 
        ADD CONSTRAINT uq_manufacturer_sku UNIQUE (manufacturer_id, sku);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint uq_manufacturer_sku already exists or cannot be created.';
END $$;
