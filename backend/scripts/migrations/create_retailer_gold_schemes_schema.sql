-- ============================================================
-- RETAILER GOLD SCHEMES SCHEMA
-- Enables retailers to create custom Gold Accumulation Schemes
-- fixing the locked gold rate, monthly amount, target weight, and tenure.
-- ============================================================

CREATE TABLE IF NOT EXISTS retailer_gold_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fixed_gold_rate NUMERIC(12,2) DEFAULT 7245.00,
  monthly_amount NUMERIC(12,2) NOT NULL,
  target_gold_grams NUMERIC(10,4),
  time_period_months INTEGER NOT NULL DEFAULT 11,
  frequency VARCHAR(50) DEFAULT 'MONTHLY',
  bonus_description VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_retailer_gold_schemes_retailer_id ON retailer_gold_schemes(retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_gold_schemes_status ON retailer_gold_schemes(status);

-- Enable RLS
ALTER TABLE retailer_gold_schemes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active schemes so customers can browse
DROP POLICY IF EXISTS "Public can view active retailer gold schemes" ON retailer_gold_schemes;
CREATE POLICY "Public can view active retailer gold schemes"
ON retailer_gold_schemes FOR SELECT
USING (true);

-- Allow retailers to modify their own schemes
DROP POLICY IF EXISTS "Retailers can manage own gold schemes" ON retailer_gold_schemes;
CREATE POLICY "Retailers can manage own gold schemes"
ON retailer_gold_schemes FOR ALL
USING (
  retailer_id IN (
    SELECT id FROM retailers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR retailer_id::text = auth.uid()::text
);
