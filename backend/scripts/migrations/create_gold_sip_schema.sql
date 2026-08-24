-- =========================================================
-- PART 2: Gold SIP (Systematic Investment Plan) Schema
-- =========================================================

-- 1. Benchmark Gold Price History Table
CREATE TABLE IF NOT EXISTS gold_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_per_gram NUMERIC(12, 2) NOT NULL CHECK (price_per_gram > 0),
  purity VARCHAR(10) NOT NULL DEFAULT '24K',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Gold SIP Subscriptions Table
CREATE TABLE IF NOT EXISTS gold_sips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SIP Installment Transactions Log
CREATE TABLE IF NOT EXISTS gold_sip_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sip_id UUID NOT NULL REFERENCES gold_sips(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  gold_price_per_gram NUMERIC(12, 2) NOT NULL CHECK (gold_price_per_gram > 0),
  gold_quantity NUMERIC(12, 4) NOT NULL CHECK (gold_quantity > 0),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Available Gold Balance (Wallet) Table
CREATE TABLE IF NOT EXISTS gold_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  gold_balance NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (gold_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Auditable Gold Double-Entry Ledger Table
CREATE TABLE IF NOT EXISTS gold_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_type VARCHAR(30) NOT NULL CHECK (
    transaction_type IN ('SIP_PURCHASE', 'GOLD_PURCHASE', 'GOLD_REDEMPTION', 'GOLD_ADJUSTMENT')
  ),
  reference_id UUID,
  gold_quantity NUMERIC(12, 4) NOT NULL,
  gold_price_per_gram NUMERIC(12, 2) NOT NULL CHECK (gold_price_per_gram > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gold_sips_customer_id ON gold_sips(customer_id);
CREATE INDEX IF NOT EXISTS idx_gold_sip_tx_customer_id ON gold_sip_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_customer_id ON gold_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_gold_prices_effective_from ON gold_prices(effective_from DESC);
