-- ============================================================
-- CJP Version 2.0 Migration — Step 3.1: Add retailer_code Column
-- ============================================================

-- 1. Safely add retailer_code column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'retailers' 
          AND column_name = 'retailer_code'
    ) THEN
        ALTER TABLE public.retailers ADD COLUMN retailer_code VARCHAR(50);
    END IF;
END $$;

-- 2. Backfill legacy/existing retailer records with generated unique access codes
-- Format: 'CJP-' + 6 uppercase hex characters derived from internal UUID
UPDATE public.retailers
SET retailer_code = UPPER('CJP-' || SUBSTRING(MD5(id::text) FROM 1 FOR 6))
WHERE retailer_code IS NULL OR TRIM(retailer_code) = '';

-- 3. Enforce NOT NULL constraint
ALTER TABLE public.retailers ALTER COLUMN retailer_code SET NOT NULL;

-- 4. Create case-insensitive unique index and unique constraint on retailer_code
DROP INDEX IF EXISTS public.idx_retailers_code_upper;
CREATE UNIQUE INDEX idx_retailers_code_upper ON public.retailers (UPPER(TRIM(retailer_code)));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_retailer_code'
    ) THEN
        ALTER TABLE public.retailers ADD CONSTRAINT unique_retailer_code UNIQUE (retailer_code);
    END IF;
END $$;
