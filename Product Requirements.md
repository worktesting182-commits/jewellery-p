# Product Requirements Document (PRD)
## Circular Junction Platform (CJP) / Craftsman Jewellery Platform
**Version:** 2.0 (Updated Multi-Tenant Customer–Retailer Access Model)  
**Project Type:** Full-Stack Sustainable Web Application  
**Prepared By:** Abhinand Viswam & Core Engineering Team  
**Technology Stack:** React.js (Vite), Node.js, Express.js, Supabase (PostgreSQL & Auth Storage), Tailwind CSS  

---

## 1. Executive Summary
The **Circular Junction Platform (CJP) / Craftsman Jewellery Platform** is a sustainable fine jewellery e-commerce and multi-tenant supply chain platform designed to promote circular jewellery trade by connecting manufacturers, retailers, customers, and administrators in a secure ecosystem.

Unlike open-market retail platforms, CJP operates under a **private, multi-tenant customer–retailer access model**. Customers cannot randomly discover, search, or browse public retailer directories. Access to a retailer's storefront, product catalog, cart, and order placement is strictly granted **only when a customer explicitly enters that retailer's unique public access ID (e.g., `CJP-ABC123`)**.

The platform seamlessly supports:
- Multi-tier B2B wholesale artisan cataloguing and retailer listing with custom retail markups (`selling_price`)
- Fine jewellery manufacturing lifecycle tracking & 7-stage fulfillment movement with carrier dispatch logistics (AWB tracking)
- Strict multi-tenant customer–retailer membership (`customer_retailers`) allowing customers to belong to multiple authorized stores while maintaining full isolation between stores
- Digital Gold SIP investment management and digital Gold Wallet balances
- Gold recycling workflows, rewards, and centralized administrative controls

The application supports four distinct user roles:
1. **Customer**
2. **Manufacturer**
3. **Retailer**
4. **Administrator**

---

## 2. Product Vision
To establish a secure, multi-tenant digital ecosystem that promotes sustainable consumption, fine artisan craftsmanship, transparent wholesale supply chain movement, and responsible recycling—while empowering retail brands to maintain private, controlled customer relationships accessible exclusively via unique retailer codes.

---

## 3. Problem Statement
Traditional e-commerce platforms either operate as open public marketplaces (exposing retailer catalogs and customer data to arbitrary discovery) or isolated single-store silos (requiring customers to create separate user accounts for every single retailer).

Key challenges addressed by CJP:
- **Unrestricted Retailer Exposure:** Retailers require brand privacy and exclusive customer engagement without public directory indexing or competitive cross-browsing.
- **Account Fatigue:** Customers dealing with multiple jewellery stores face friction creating separate accounts for each retailer.
- **Lack of Multi-Tenant Authorization Enforcement:** Systems often rely on frontend filters to isolate storefront data, creating severe security vulnerabilities where users manipulate query parameters or API payloads to access unauthorized retailer catalogs, carts, or orders.
- **Supply Chain Disconnect:** Traditional apps lack structured gold recycling, manufacturing movement tracking (7-stage pipeline), and digital bullion SIP investments.

CJP solves these challenges by combining a single, unified customer authentication system with a strict multi-tenant authorization boundary (`customer_retailers`), isolated retailer-scoped carts/orders, and end-to-end supply chain logistics.

---

## 4. Product Goals

### Primary Goals
1. **Private Multi-Tenant Customer–Retailer Access Model**
   Enforce explicit, code-driven retailer joining (`CJP-XXXXXX`). Prevent all public retailer browsing, search, recommendations, and open directories. Enforce backend and database-level multi-tenant isolation.
2. **Reusable Customer Identity Across Retailers**
   Allow a single customer account to hold authorized access to multiple retailers through a dedicated "My Stores" interface, eliminating multi-account creation while isolating store data.
3. **Sustainable Fine Jewellery Marketplace & Custom Retail Listings**
   Enable manufacturers to list handcrafted fine jewellery with detailed purity, weight, stone pricing, and making charges. Allow retailers to list manufacturer products with dynamic retail price markups (`selling_price`) or offer custom in-house artisan items.
4. **End-to-End Fulfillment & Logistics Movement**
   Provide manufacturers and retailers visibility across 7 sequential order stages (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`) with logistics dispatch metadata (Carrier Name, AWB Tracking Code, Estimated Delivery Date).
5. **Circular Economy, Digital Gold SIP & Reward System**
   Encourage customer gold recycling with reward points and provide accessible digital Gold SIP investment schemes backed by daily bullion rate updates.
6. **Centralized Administration**
   Provide administrators with tools to manage user roles, platform activation statuses, unique retailer codes, categories, daily gold rates, Gold SIP holdings, and system audits.

---

## 5. Success Metrics (KPIs)

### Business KPIs
- Number of active registered users across all roles
- Retailer conversion rate following unique code distribution
- Customer retention across multiple authorized store memberships ("My Stores")
- Total volume of orders processed through the 7-stage fulfillment pipeline
- Volume of gold recycled and reward points redeemed
- Active Gold SIP subscriptions and total bullion grams held in customer wallets

### Technical KPIs
- Zero unauthorized cross-retailer data access (100% authorization enforcement at API & Supabase RLS levels)
- Sub-300 ms REST API response latency for retailer code validation and context switching
- 99.9% application uptime
- Zero orphan cart/order records during retailer code updates or customer membership state changes

---

## 6. Target Users & Roles

### 1. Customer
**Responsibilities & Capabilities:**
- Access platform using a unified user account (email/password).
- Join new retailers **exclusively** by explicitly entering a valid unique retailer code (e.g., `CJP-ABC123`).
- View and switch between authorized stores via the **"My Stores"** portal.
- Browse fine jewellery products, categories, purity (18K/22K/24K), and materials **only for the currently active authorized retailer store**.
- Maintain isolated, retailer-specific shopping carts for each authorized retailer.
- Checkout (Cash on Delivery or Simulated Payment) and place orders tied strictly to the active retailer context.
- Track 7-stage order fulfillment progress and view dispatch logistics (Carrier, AWB Tracking Code, Estimated Delivery Date).
- Enroll in Digital Gold SIP schemes, track digital Gold Wallet balances (in grams & asset value), and request redemption.
- Submit gold recycling requests, earn reward points, and receive role notifications.

### 2. Retailer
**Responsibilities & Capabilities:**
- Receive and manage a unique, public-facing retailer access code (e.g., `CJP-ABC123`).
- View and monitor authorized customer memberships (`customer_retailers`).
- Browse Master Manufacturer Wholesale Catalogue and import manufacturer items into Retailer Storefront with custom retail markup prices (`selling_price`).
- Create and manage custom In-House Retailer Artisan products.
- Monitor store inventory, stock availability (`ACTIVE`, `OUT_OF_STOCK`, `INACTIVE`), sales analytics, and order history.
- Create and manage Retailer Gold Schemes for authorized customers.

### 3. Manufacturer
**Responsibilities & Capabilities:**
- Manage master wholesale product catalog (Create, Edit with input sanitization, Hard Purge INACTIVE products).
- Specify wholesale base price, gross weight (g), making charges, stone details, and purity specifications.
- Upload high-resolution product imagery to Supabase Storage.
- Manage incoming wholesale and fulfillment orders across the 7-stage pipeline (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`).
- Input dispatch logistics metadata (Carrier Name, AWB Tracking Code, Estimated Delivery Date) during shipment.
- Receive and process customer recycling requests.

### 4. Administrator
**Responsibilities & Capabilities:**
- Oversee user accounts, partner approvals, and role authorizations.
- Manage and monitor Retailer Unique Codes (generation, status toggle, manual code regeneration).
- Manage platform product categories (CRUD).
- Set daily global Gold Bullion market rates and maintain historical rate ledgers.
- Oversee Gold SIP subscriptions, customer gold wallet balances, and recycling rewards.
- Monitor order movement pipelines, audit logs, and global platform analytics.

---

## 7. Customer–Retailer Access Model & Architecture Rules

### A. Business Rules
1. **Strict No-Discovery Policy:** The platform must NOT contain any user-facing feature that lists, searches, recommends, or exposes non-authorized retailers to customers.
2. **Explicit Code Entry:** The ONLY mechanism for a customer to access or join a new retailer is by entering that retailer's unique access code (`retailer_code`).
3. **Multi-Store Membership:** A customer account can hold memberships with multiple retailers. Once authorized, those retailers appear under the customer's "My Stores" section.
4. **Retailer-Scoped Data:** Products, store listings, shopping carts, and order checkouts are strictly isolated by `retailer_id`. Customers cannot view or interact with items from Retailer B while operating within Retailer A's store context.

### B. Retailer Unique ID Requirements
- **Public Format:** Uppercase alphanumeric string with standard platform prefix (e.g., `CJP-ABC123`, `CJP-XYZ789`, `CJP-GOLD456`).
- **Uniqueness & Indexing:** Guaranteed unique at the database layer via `UNIQUE(retailer_code)` constraint with case-insensitive normalization (`UPPER(TRIM(code))`).
- **Decoupling from Primary Keys:** Decoupled from internal database UUID primary keys (`id`). Public APIs expose `retailer_code` for validation, but internal mapping uses `retailer_id` (UUID).
- **Code Regeneration:** Administrators or Retailers can regenerate public access codes. Regenerating a code does NOT revoke access for existing `customer_retailers` mapped to the retailer's internal `id`, but requires new customers to use the newly generated code.
- **Status Checks:** Retailer access validation verifies that `retailers.status == 'ACTIVE'`. Inactive or suspended retailers reject new access attempts and block active sessions.

---

## 8. Required Customer Access & Store Switching Workflows

### A. Production Customer Access Flow
```text
                  Customer Enters Retailer Code
                               │
                               ▼
               Validate Retailer Code (Format & DB)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
      Code Invalid / Inactive               Code Valid & Active
            │                                     │
      Return Error Message                        ▼
 (e.g., "Invalid Retailer Code")      Check Customer Auth Session
                                                  │
                                ┌─────────────────┴─────────────────┐
                                ▼                                   ▼
                        User Not Authenticated               User Authenticated
                                │                                   │
                         Prompt Login / Signup                      ▼
                                │                       Check customer_retailers Mapping
                                ▼                                   │
                         Authenticate User            ┌─────────────┴─────────────┐
                                │                     ▼                           ▼
                                └──────────────► Already Exists             Does Not Exist
                                                      │                           │
                                                      ▼                           ▼
                                              Set Active Store         Create customer_retailers Record
                                                  Context                   (status = 'ACTIVE')
                                                      │                           │
                                                      └───────────────────────────┤
                                                                                  ▼
                                                                        Set Active Store Context
                                                                                  │
                                                                                  ▼
                                                                       Open Retailer Storefront
```

### B. "My Stores" and Retailer Switching Workflow
1. When a logged-in customer opens the platform, the backend retrieves all active memberships from `customer_retailers` where `customer_id = auth.uid()` and `status = 'ACTIVE'`.
2. The UI renders the **"My Stores"** navigation bar / drawer listing **only** authorized retailers (e.g., `[ABC Jewellery, XYZ Jewellery]`) along with a **"+ Join Another Store"** button.
3. Switching store context updates the frontend state (`activeRetailerId`) and informs the API header/context.
4. The product view, category menu, cart, and checkout instantly shift to reflect the selected retailer's isolated environment.

---

## 9. Scope

### In Scope (MVP Version 2.0)
- **Authentication & Authorization:**
  - Supabase Auth integration (Signup, Login, Password Reset, JWT sessions).
  - Multi-tenant Customer–Retailer membership mapping (`customer_retailers`).
  - Strict role-based access control (`Customer`, `Retailer`, `Manufacturer`, `Admin`).
- **Retailer Access & Code Management:**
  - Code validation endpoint (`POST /api/retailers/validate-code`).
  - Join store endpoint (`POST /api/retailers/join`).
  - "My Stores" listing endpoint (`GET /api/customer/stores`).
  - Active retailer context switching on frontend & backend.
- **Product & Catalog Management:**
  - Manufacturer wholesale product CRUD with input sanitization (stripping `₹`, commas, `"g"`).
  - Hard purge / delete INACTIVE products across system tables (`products`, `manufacturer_products`, `retailer_products`, `product_images`).
  - Retailer product listing with dynamic markup (`selling_price`) and custom in-house retailer artisan products.
  - Retailer-scoped product browsing & filtering (Category, Price, Material, Purity).
- **Cart & Order Isolation:**
  - Retailer-scoped shopping carts (`carts` table with `retailer_id`).
  - Multi-cart management (switching active store loads that store's specific cart).
  - Single-retailer order placement & fulfillment enforcement.
  - 7-stage order fulfillment movement engine (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`).
  - Manufacturer Logistics Dispatch Modal (Carrier Company, AWB Tracking Code, Estimated Delivery Date).
- **Digital Gold SIP & Recycling:**
  - Daily Gold Rate management by Admin & historical logs.
  - Gold SIP scheme enrollment, installment tracking, and digital Gold Wallet balances (grams & valuation).
  - Gold redemption request workflow.
  - Recycling request creation, status updates, approval, and reward points issuance.
- **Security & Storage:**
  - Supabase RLS policies enforcing multi-tenant customer access boundaries.
  - Supabase Storage integration (`product-images`, `profile-images`).

### Out of Scope (Explicitly Excluded)
- **Public Retailer Discovery Features:** Public retailer directories, retailer search bars, recommended stores, random store browsing, store locator maps.
- **Live Payments:** Third-party gateway API keys (Stripe/Razorpay live production integration). Simulated payment & Cash on Delivery (COD) are used.
- **Live Carrier Webhooks:** Live automated courier webhooks (manual logistics input via Manufacturer Dispatch Modal is used).
- **Social & AI Features:** Chatbots, product reviews, social share buttons, AI product recommendations.
- **Cross-Retailer Cart Checkout:** Multi-retailer combined carts (customers must checkout items per retailer).

---

## 10. Functional Requirements

### Authentication & Retailer Joining
- **FR-01 User Signup & Login:** Secure authentication using Supabase Auth with JWT issuance.
- **FR-02 Role Assignment:** Assign user roles (`Customer`, `Manufacturer`, `Retailer`, `Admin`) upon registration.
- **FR-03 Validate Retailer Code:** Verify public `retailer_code` string, checking existence, case-normalization, and active status (`status == 'ACTIVE'`).
- **FR-04 Join Retailer:** Create a unique mapping in `customer_retailers(customer_id, retailer_id)` upon successful code entry.
- **FR-05 List Authorized Stores ("My Stores"):** Retrieve all active retailer relationships for the authenticated customer. Non-authorized retailers must never be exposed.
- **FR-06 Switch Store Context:** Allow customers to switch active retailer context among authorized stores.

### Product & Storefront Management
- **FR-07 Manufacturer Product CRUD:** Create, update, and hard purge/delete products with server-side input sanitization.
- **FR-08 Product Image Upload:** Store images securely in Supabase Storage (`product-images` bucket).
- **FR-09 Retailer Store Listing:** Retailers import manufacturer wholesale items into their store with dynamic retail price markup (`selling_price`).
- **FR-10 In-House Retailer Products:** Retailers add custom artisan products directly to their storefront.
- **FR-11 Retailer-Scoped Product Search & Filter:** Customers browse/search products scoped strictly to their active authorized retailer.

### Cart & Order Isolation
- **FR-12 Retailer-Scoped Cart Management:** Customers add items to a cart isolated strictly by `retailer_id`. Prevent mixing items from different retailers in a single cart.
- **FR-13 Independent Multi-Retailer Carts:** Switching active stores switches the displayed cart context to that store's active cart without deleting items from other store carts.
- **FR-14 Single-Retailer Checkout:** Validate that all cart items belong to the active retailer before placing order (COD / Simulated Payment).
- **FR-15 7-Stage Order Movement Engine:** Track orders sequentially: `PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`.
- **FR-16 Logistics Dispatch Modal:** Allow manufacturers to input Logistics Carrier Name, AWB Tracking Code, and Estimated Delivery Date when moving order to `SHIPPED`.
- **FR-17 Order Movement Progress UI:** Display 7-stage visual progress bar and carrier tracking metadata to customers.

### Digital Gold SIP, Wallet & Recycling
- **FR-18 Daily Gold Rate Setting:** Administrators update daily bullion gold market rates per gram.
- **FR-19 Gold SIP Enrollment & Wallet Ledger:** Customers subscribe to Gold SIP schemes, pay simulated installments, and monitor digital wallet holdings (grams & net asset value).
- **FR-20 Gold Redemption Request:** Customers initiate gold redemption requests against wallet balances.
- **FR-21 Gold Recycling Request:** Customers submit recycling requests for scrap gold/jewellery.
- **FR-22 Recycling Approval & Rewards:** Admins/Manufacturers process recycling items and grant customer reward points upon completion.

---

## 11. Non-Functional Requirements

- **Security & Authorization Isolation:**
  - Multi-tenant data isolation MUST be enforced at both the API layer (Express middleware) and Database layer (Supabase RLS).
  - Parameter tampering (e.g., passing another retailer's UUID in headers or payload) MUST result in an immediate `403 Forbidden` response.
  - Public retailer access codes MUST be protected against brute-force enumeration via API rate limiting.
- **Performance:**
  - API response time for retailer code validation and store switching under 250 ms.
  - Overall API latency under 300 ms for catalog and cart operations.
  - Database queries MUST utilize indexes on `(customer_id, retailer_id)` and `retailer_code`.
- **Reliability & Data Consistency:**
  - Database foreign key constraints MUST prevent orphan cart items or orders.
  - Database transactions MUST be used during order creation and inventory deduction.
- **Usability:**
  - Clean "My Stores" switcher UI with active store indicators.
  - Intuitive retailer code entry modal with validation feedback.
  - Responsive design across mobile, tablet, and desktop views.

---

## 12. Complete Edge Cases & Handling Protocols

The system MUST address all 16 identified edge cases:

1. **Invalid Retailer Code Entered:**
   - *Behavior:* User receives error response: `"Invalid Retailer Code. Please check the code provided by your jeweller."` No session changes occur.
2. **Retailer Code Does Not Exist:**
   - *Behavior:* Backend lookup yields zero rows. Returns `404 Not Found` with generic anti-enumeration error.
3. **Retailer is Inactive:**
   - *Behavior:* Retailer record exists but `status = 'INACTIVE'`. Returns `403 Forbidden`: `"This retailer storefront is currently inactive."` Joining is blocked.
4. **Retailer is Suspended:**
   - *Behavior:* Retailer `status = 'SUSPENDED'`. Returns `403 Forbidden`: `"Access to this retailer is suspended."` Existing customer sessions are blocked.
5. **Customer Already Belongs to Retailer:**
   - *Behavior:* Attempting to join an already mapped retailer returns success idempotently and switches active context to that store without creating duplicate records.
6. **Duplicate Membership Attempt:**
   - *Behavior:* Database `UNIQUE(customer_id, retailer_id)` constraint catches concurrent joins. API gracefully handles conflict and returns existing active membership.
7. **Customer Direct Access Attempt via Database UUID:**
   - *Behavior:* Customer attempts to hit `GET /api/products?retailer_id=<UUID>` using an un-joined retailer's UUID. Middleware checks `customer_retailers` and rejects request with `403 Forbidden`.
8. **Parameter Tampering in API Payload:**
   - *Behavior:* Customer sends checkout request with cart items belonging to Retailer B while operating under Retailer A context. Backend authorization service detects mismatch and aborts transaction with `400 Bad Request / 403 Forbidden`.
9. **Retailer ID Manipulation in Frontend State:**
   - *Behavior:* Customer manually modifies React state or local storage `activeRetailerId`. Subsequent API request triggers backend `verifyRetailerAccess` check against DB, failing validation and forcing state reset.
10. **Customer Has Carts Across Multiple Retailers:**
    - *Behavior:* System maintains independent cart records in `carts` table keyed by `(customer_id, retailer_id)`. Loading store context fetches only the cart corresponding to the active retailer.
11. **Customer Switches Store Context with Items in Active Cart:**
    - *Behavior:* Cart items for Retailer A remain safely stored in DB. Switching active context to Retailer B loads Retailer B's cart. Returning to Retailer A restores Retailer A's cart intact.
12. **Retailer Becomes Inactive After Customer Joined:**
    - *Behavior:* Existing `customer_retailers` record exists, but `retailers.status` is updated to `'INACTIVE'`. API authorization middleware verifies retailer status on every request and blocks access with `"Retailer storefront no longer active"`.
13. **Customer Retailer Membership Disabled/Revoked by Admin:**
    - *Behavior:* Admin sets `customer_retailers.status = 'REVOKED'`. Backend authorization checks check `customer_retailers.status == 'ACTIVE'`, denying access and removing store from customer's "My Stores" list.
14. **Existing Historical Orders After Access Revocation:**
    - *Behavior:* Customer's active membership is revoked, but historical orders in `orders` table retain `customer_id` and `retailer_id`. Customer can view past order history under read-only account history, but cannot place new orders or view current products.
15. **Retailer Public Code Regeneration:**
    - *Behavior:* Retailer regenerates code from `CJP-OLD123` to `CJP-NEW456`. `customer_retailers` table links `customer_id` to `retailer_id` (UUID), so existing customer memberships remain completely unaffected. Only new customers must use `CJP-NEW456`.
16. **Data Migration of Legacy Customers/Retailers:**
    - *Behavior:* Legacy database records missing `customer_retailers` mappings are automatically backfilled during migration using historical order relationships or default initial access records.

---

## 13. Data Migration Requirements

To transition the live application from the single-tenant model to the new Multi-Tenant Customer–Retailer Access Model without downtime or data loss:

1. **Schema Migration:**
   - Add `retailer_code` column (`VARCHAR(50)`, `UNIQUE`, `NOT NULL`) to `retailers` table.
   - Create `customer_retailers` junction table with foreign keys, indexes, and `UNIQUE(customer_id, retailer_id)` constraint.
   - Add `retailer_id` column to `carts` table and create composite index `(customer_id, retailer_id)`.
2. **Data Backfill Strategy:**
   - Generate unique `retailer_code` values (e.g., `CJP-` + uppercase prefix) for all existing retailers.
   - Backfill `customer_retailers` records using historical order mappings (`SELECT DISTINCT customer_id, retailer_id FROM orders`).
   - For legacy customers without past orders, map them to an initial default retailer or prompt for retailer code on next login.
   - Backfill `retailer_id` on existing `carts` records based on the retailer of cart items.
3. **Data Integrity & Rollback Plan:**
   - Execute migration script within a single database transaction.
   - Perform automated validation checks to verify zero orphan carts, zero orphan orders, and 100% code uniqueness before committing.
   - Maintain full database backup snapshot prior to execution.

---

## 14. Acceptance Criteria

The MVP Version 2.0 release will be considered complete when:

1. **Zero Public Discovery:** No customer-facing view or API exposes a public directory, search bar, or list of un-joined retailers.
2. **Code Entry & Validation:** A customer can successfully enter a valid retailer code (e.g., `CJP-ABC123`), pass authentication, create a `customer_retailers` record, and enter the storefront.
3. **Multi-Store Navigation ("My Stores"):** Logged-in customers with multiple authorized store memberships can seamlessly view and switch between their stores via the UI.
4. **Data Isolation:** Customers cannot view products, carts, or orders of unauthorized retailers. API and RLS reject parameter-tampered requests with `403 Forbidden`.
5. **Cart & Order Integrity:** Carts remain isolated per retailer. Order placement validates that `customer_retailers` membership = cart retailer = product retailer = order retailer.
6. **Preservation of Core Features:** All existing manufacturing catalog tools, 7-stage order fulfillment pipelines, logistics dispatch modals (Carrier, AWB), Digital Gold SIPs, Gold Wallets, recycling workflows, rewards, and admin controls operate without regression.
7. **Migration Verification:** Production migration script successfully executes with zero data loss or orphan records.
