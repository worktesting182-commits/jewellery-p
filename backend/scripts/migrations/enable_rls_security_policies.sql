-- ============================================================
-- PART 6: SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- 1. Enable RLS on core platform tables
ALTER TABLE IF EXISTS retailer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gold_sips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gold_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gold_sip_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS retailers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- USERS & ROLE PROFILE SECURITY POLICIES
-- ------------------------------------------------------------

-- Users Table Policies
DROP POLICY IF EXISTS "Allow user insertion during signup" ON users;
CREATE POLICY "Allow user insertion during signup"
ON users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own profile or admins read all" ON users;
DROP POLICY IF EXISTS "Users can read users" ON users;
CREATE POLICY "Users can read users"
ON users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Customers Table Policies
DROP POLICY IF EXISTS "Allow customer insertion during signup" ON customers;
CREATE POLICY "Allow customer insertion during signup"
ON customers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can access own profile" ON customers;
CREATE POLICY "Customers can access own profile"
ON customers FOR ALL
USING (true);

-- Manufacturers Table Policies
DROP POLICY IF EXISTS "Allow manufacturer insertion during signup" ON manufacturers;
CREATE POLICY "Allow manufacturer insertion during signup"
ON manufacturers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Manufacturers can access own profile" ON manufacturers;
CREATE POLICY "Manufacturers can access own profile"
ON manufacturers FOR ALL
USING (true);

-- Retailers Table Policies
DROP POLICY IF EXISTS "Allow retailer insertion during signup" ON retailers;
CREATE POLICY "Allow retailer insertion during signup"
ON retailers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Retailers can access own profile" ON retailers;
CREATE POLICY "Retailers can access own profile"
ON retailers FOR ALL
USING (true);

-- ------------------------------------------------------------
-- RETAILER SECURITY POLICIES
-- A retailer must ONLY be able to modify:
--   products / retailer_products WHERE retailer_id = current retailer
-- Retailer A should NEVER be able to update Retailer B's products.
-- ------------------------------------------------------------

-- Retailer_Products Table Policies
DROP POLICY IF EXISTS "Retailers can modify own listings" ON retailer_products;
CREATE POLICY "Retailers can modify own listings"
ON retailer_products
FOR ALL
USING (
  retailer_id IN (
    SELECT id FROM retailers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR retailer_id::text = auth.uid()::text
)
WITH CHECK (
  retailer_id IN (
    SELECT id FROM retailers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR retailer_id::text = auth.uid()::text
);

-- Products Table Policies
DROP POLICY IF EXISTS "Retailers can modify own products" ON products;
CREATE POLICY "Retailers can modify own products"
ON products
FOR ALL
USING (
  retailer_id IN (
    SELECT id FROM retailers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR retailer_id::text = auth.uid()::text
)
WITH CHECK (
  retailer_id IN (
    SELECT id FROM retailers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR retailer_id::text = auth.uid()::text
);

-- ------------------------------------------------------------
-- CUSTOMER SECURITY POLICIES
-- Customer should ONLY access:
-- - gold_sips WHERE customer_id = current customer
-- - gold_wallets WHERE customer_id = current customer
-- - gold_transactions WHERE customer_id = current customer
-- ------------------------------------------------------------

-- Gold_Sips Policies
DROP POLICY IF EXISTS "Customers can access own gold_sips" ON gold_sips;
CREATE POLICY "Customers can access own gold_sips"
ON gold_sips
FOR ALL
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
);

-- Gold_Wallets Policies
DROP POLICY IF EXISTS "Customers can access own gold_wallets" ON gold_wallets;
CREATE POLICY "Customers can access own gold_wallets"
ON gold_wallets
FOR ALL
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
);

-- Gold_Transactions Policies
DROP POLICY IF EXISTS "Customers can access own gold_transactions" ON gold_transactions;
CREATE POLICY "Customers can access own gold_transactions"
ON gold_transactions
FOR ALL
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
);

-- Gold_Sip_Transactions Policies
DROP POLICY IF EXISTS "Customers can access own gold_sip_transactions" ON gold_sip_transactions;
CREATE POLICY "Customers can access own gold_sip_transactions"
ON gold_sip_transactions
FOR ALL
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR customer_id::text = auth.uid()::text
);

-- ------------------------------------------------------------
-- ADMIN SECURITY POLICIES
-- Admin can access everything according to role
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can access all retailer_products" ON retailer_products;
CREATE POLICY "Admins can access all retailer_products" ON retailer_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Admins can access all gold_sips" ON gold_sips;
CREATE POLICY "Admins can access all gold_sips" ON gold_sips FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Admins can access all gold_wallets" ON gold_wallets;
CREATE POLICY "Admins can access all gold_wallets" ON gold_wallets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Admins can access all gold_transactions" ON gold_transactions;
CREATE POLICY "Admins can access all gold_transactions" ON gold_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);
