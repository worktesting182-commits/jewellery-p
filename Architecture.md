# Architecture Document
## Circular Junction Platform (CJP)
**Version:** 2.0 (Multi-Tenant Customer–Retailer Access Model)  
**Architecture Style:** Three-Tier Web Architecture (Client–Server Multi-Tenant)  
**Project Type:** Full-Stack Sustainable Fine Jewellery Platform  
**Frontend:** React.js + Vite + Tailwind CSS  
**Backend:** Node.js + Express.js  
**Database & Authentication:** Supabase (PostgreSQL + Auth + Storage)  

---

## 1. Purpose
This Architecture Document defines the comprehensive technical architecture for the **Circular Junction Platform (CJP)** Version 2.0. It incorporates the **Multi-Tenant Customer–Retailer Access Model**, security boundaries, database schema changes, Supabase Row Level Security (RLS) policies, backend authorization middleware, cart/order isolation, and data migration strategy.

---

## 2. System Overview & Access Model Architecture

CJP operates as a multi-tenant platform with four core user roles:
1. **Customer**
2. **Retailer**
3. **Manufacturer**
4. **Administrator**

### Core Architectural Shift: Private Code-Gated Retailer Access
To guarantee brand privacy and prevent competitive cross-browsing, CJP eliminates all public retailer directories, search features, and open discovery mechanisms. 

- Customers access a retailer **only by explicitly providing a valid unique access code** (e.g., `CJP-ABC123`).
- Customer identity is multi-tenant: a single customer account (`auth.users`) can establish active memberships with multiple retailers through the `customer_retailers` mapping table.
- A customer navigates between authorized stores via an active store context (`activeRetailerId`).
- Data access (products, listings, carts, orders) is strictly scoped to the active `retailer_id` and verified at both the API middleware and database (Supabase RLS) layers.

---

## 3. High-Level Architecture Diagram

```text
                                     CUSTOMER
                                         │
                         Enter Unique Code (CJP-ABC123)
                                         │
                                         ▼
                     ┌──────────────────────────────────────┐
                     │   PRESENTATION LAYER (React + Vite)   │
                     │   Active Retailer Context Provider   │
                     └───────────────────┬──────────────────┘
                                         │ HTTPS / REST (JWT + Header)
                                         ▼
                     ┌──────────────────────────────────────┐
                     │    APPLICATION LAYER (Express.js)    │
                     │   verifyRetailerAccess Middleware    │
                     └───────────────────┬──────────────────┘
                                         │
                                         ▼
             ┌──────────────────────────────────────────────────────┐
             │       DATA LAYER (Supabase PostgreSQL + RLS)         │
             └───────────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                             CUSTOMER_RETAILERS MAPPING
                                         │
                             Authorization Enforcement
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
    RETAILER A                      RETAILER B                      RETAILER C
  (CJP-ABC123)                    (CJP-XYZ789)                    (CJP-GOLD456)
    │     │                         │     │                         │     │
    ▼     ▼                         ▼     ▼                         ▼     ▼
Products Carts                   Products Carts                   Products Carts
    │                               │                               │
    ▼                               ▼                               ▼
 Orders                          Orders                          Orders
```

---

## 4. Layered Architecture & Key Responsibilities

### Presentation Layer (Frontend - React + Vite)
- **Active Store Context (`RetailerContext`):** Tracks currently selected `activeRetailerId` and available authorized stores (`customerStores`).
- **Code Entry Modal:** Validates retailer code and triggers join flow.
- **My Stores Switcher:** Interface allowing customers to switch between authorized retailers.
- **Retailer-Scoped Components:** Storefront, Catalog View, Product Details, Cart, Checkout, Order Tracking.

### Application Layer (Backend - Node.js + Express.js)
- **Retailer Code Service:** Formats, normalizes (`UPPER(TRIM(code))`), and validates public access codes.
- **Authorization Middleware (`verifyRetailerAccess`):** Intercepts retailer-scoped endpoints and verifies active `customer_retailers` mapping before executing controller logic.
- **Business Controllers:** User Management, Product Catalog (CRUD & Purge), Retailer Store Listings, Cart Isolation, Order Fulfillment (7-stage movement engine), Digital Gold SIP, Recycling, Rewards.

### Data Layer (Supabase PostgreSQL + Storage)
- **PostgreSQL Database:** Enforces relational integrity, foreign key constraints, `UNIQUE` indexes, and transaction boundaries.
- **Supabase Row Level Security (RLS):** Database-level access control policies blocking unauthorized SQL queries even if API logic is bypassed.
- **Supabase Storage:** Buckets (`product-images`, `profile-images`) storing media assets.

---

## 5. Database Architecture & Schema Design

### Main Entities & DDL Specifications

#### 1. `retailers`
Stores retailer profile information and the unique public access identifier.
```sql
CREATE TABLE public.retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    retailer_code VARCHAR(50) NOT NULL UNIQUE, -- Public access code (e.g. CJP-ABC123)
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_retailers_code_upper ON public.retailers (UPPER(retailer_code));
```

#### 2. `customer_retailers` (Junction Table)
Defines the many-to-many relationship and authorization lifecycle between customers and retailers.
```sql
CREATE TABLE public.customer_retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    retailer_id UUID NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, REVOKED, BLOCKED
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_customer_retailer UNIQUE (customer_id, retailer_id)
);

CREATE INDEX idx_cust_ret_customer ON public.customer_retailers(customer_id);
CREATE INDEX idx_cust_ret_retailer ON public.customer_retailers(retailer_id);
CREATE INDEX idx_cust_ret_lookup ON public.customer_retailers(customer_id, retailer_id, status);
```

#### 3. `customers`
Stores customer profile attributes. Decoupled from single retailer ownership.
```sql
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `carts`
Retailer-scoped cart header ensuring items from different retailers remain isolated.
```sql
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    retailer_id UUID NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_customer_retailer_cart UNIQUE (customer_id, retailer_id)
);

CREATE INDEX idx_carts_customer_retailer ON public.carts(customer_id, retailer_id);
```

#### 5. `orders`
Retailer-scoped order header.
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    retailer_id UUID NOT NULL REFERENCES public.retailers(id),
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', 
    -- PENDING -> ACCEPTED -> PROCESSING -> PACKAGING -> READY_FOR_SHIPMENT -> SHIPPED -> DELIVERED
    carrier_name VARCHAR(100),
    awb_tracking_code VARCHAR(100),
    estimated_delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_retailer ON public.orders(retailer_id);
```

---

## 6. Entity Relationship Diagram (ERD)

```text
       ┌──────────────┐                 ┌───────────────────────┐
       │    users     │                 │       retailers       │
       ├──────────────┤                 ├───────────────────────┤
       │ id (PK)      │                 │ id (PK)               │
       │ email        │                 │ retailer_code (UNIQUE)│
       │ role         │                 │ business_name         │
       └──────┬───────┘                 │ status                │
              │                         └───────────┬───────────┘
              │ 1:1                                 │ 1:N
       ┌──────┴───────┐                             │
       │  customers   │                             │
       ├──────────────┤                             │
       │ id (PK)      │                             │
       │ user_id (FK) │                             │
       └──────┬───────┘                             │
              │                                     │
              └───────────────┐     ┌───────────────┘
                              │     │
                              ▼     ▼
                    ┌──────────────────────────┐
                    │    customer_retailers    │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ customer_id (FK)         │
                    │ retailer_id (FK)         │
                    │ status                   │
                    │ UNIQUE(cust_id, ret_id)  │
                    └──────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │ (Authorization)    │ (Authorization)    │ (Authorization)
         ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │ products  │        │   carts   │        │  orders   │
   ├───────────┤        ├───────────┤        ├───────────┤
   │ id (PK)   │        │ id (PK)   │        │ id (PK)   │
   │ ret_id(FK)│        │ cust_id   │        │ cust_id   │
   │ price     │        │ ret_id    │        │ ret_id    │
   └───────────┘        └───────────┘        └───────────┘
```

---

## 7. Authentication & Authorization Sequence Flows

### Flow A: Retailer Unique Code Entry & Joining Flow
```text
Customer            Frontend (React)         Backend API (Express)        Supabase DB
   │                        │                         │                        │
   │── Enter "CJP-ABC123" ─►│                         │                        │
   │                        │── POST /validate-code ─►│                        │
   │                        │   { code: "CJP-ABC123" }│                        │
   │                        │                         │── SELECT retailer ────►│
   │                        │                         │   WHERE code = UPPER.. │
   │                        │                         │◄─ Return Retailer Info─│
   │                        │◄─ Return { valid:true }─│                        │
   │                        │                         │                        │
   │── Submit Join Request ─►│                         │                        │
   │                        │── POST /join-store ────►│                        │
   │                        │   Headers: JWT Session  │── Verify Auth JWT ────►│
   │                        │   Body: { retailer_id } │                        │
   │                        │                         │── INSERT INTO          │
   │                        │                         │   customer_retailers  ─►│
   │                        │                         │   ON CONFLICT DO NOTHING│
   │                        │                         │◄─ Success / Membership─│
   │                        │◄─ Return Access Token ──│                        │
   │                        │   & Update Context      │                        │
   │                        │                         │                        │
   │◄─ Open Storefront ─────│                         │                        │
```

### Flow B: Store Context Switching Flow
```text
Customer            Frontend (`RetailerContext`)       Backend API              Database
   │                            │                          │                        │
   │── Select "XYZ Jewellery" ─►│                          │                        │
   │   from "My Stores"         │── Set activeRetailerId ──│                        │
   │                            │                          │                        │
   │                            │── GET /api/products ────►│                        │
   │                            │   Header: x-retailer-id  │                        │
   │                            │                          │── verifyRetailerAccess │
   │                            │                          │   SELECT 1 FROM        │
   │                            │                          │   customer_retailers  ─►│
   │                            │                          │◄─ Active Status OK ────│
   │                            │                          │                        │
   │                            │                          │── Fetch Products ─────►│
   │                            │◄─ Return Products JSON ──│◄─ Return Data ─────────│
   │◄─ Render Isolated Store ───│                          │                        │
```

---

## 8. Supabase Row Level Security (RLS) Strategy

To enforce multi-tenant authorization boundaries directly inside PostgreSQL, the following RLS policies are applied across public tables:

### 1. `customer_retailers` Table RLS
```sql
ALTER TABLE public.customer_retailers ENABLE ROW LEVEL SECURITY;

-- Customers can view their own retailer mappings
CREATE POLICY "Customers view own memberships"
ON public.customer_retailers FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
);
```

### 2. `products` / `retailer_products` Table RLS
```sql
ALTER TABLE public.retailer_products ENABLE ROW LEVEL SECURITY;

-- Customers can view products ONLY for retailers they belong to
CREATE POLICY "Customers view authorized retailer products"
ON public.retailer_products FOR SELECT
TO authenticated
USING (
    retailer_id IN (
        SELECT retailer_id 
        FROM public.customer_retailers 
        WHERE customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid())
          AND status = 'ACTIVE'
    )
);
```

### 3. `carts` Table RLS
```sql
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own retailer carts"
ON public.carts FOR ALL
TO authenticated
USING (
    customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid())
    AND retailer_id IN (
        SELECT retailer_id FROM public.customer_retailers 
        WHERE customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid())
          AND status = 'ACTIVE'
    )
);
```

### 4. `orders` Table RLS
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own retailer orders"
ON public.orders FOR SELECT
TO authenticated
USING (
    customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
```

---

## 9. Backend API Architecture & Middleware Strategy

### `verifyRetailerAccess` Middleware
All retailer-scoped routes (`/api/products`, `/api/cart`, `/api/orders`) MUST execute the `verifyRetailerAccess` middleware.

```javascript
// middleware/verifyRetailerAccess.js
const { supabase } = require('../config/supabaseClient');

const verifyRetailerAccess = async (req, res, next) => {
    try {
        const userId = req.user.id; // From authenticate JWT middleware
        const retailerId = req.headers['x-retailer-id'] || req.query.retailer_id || req.body.retailer_id;

        if (!retailerId) {
            return res.status(400).json({ success: false, message: 'Retailer context (retailer_id) required' });
        }

        // Fetch customer record
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!customer) {
            return res.status(403).json({ success: false, message: 'Customer account not found' });
        }

        // Verify active customer_retailers membership & active retailer status
        const { data: membership, error } = await supabase
            .from('customer_retailers')
            .select('status, retailers!inner(status)')
            .eq('customer_id', customer.id)
            .eq('retailer_id', retailerId)
            .eq('status', 'ACTIVE')
            .single();

        if (error || !membership || membership.retailers.status !== 'ACTIVE') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You do not have an active membership with this retailer.' 
            });
        }

        req.customer = customer;
        req.retailerId = retailerId;
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Authorization error', error: err.message });
    }
};

module.exports = verifyRetailerAccess;
```

---

## 10. API Route Architecture

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/retailers/validate-code` | Public / Auth | Validates retailer access code format and active status |
| `POST` | `/api/retailers/join` | Customer | Creates `customer_retailers` membership link |
| `GET` | `/api/customer/stores` | Customer | Retrieves authorized stores for "My Stores" switcher |
| `GET` | `/api/products` | Customer + `verifyRetailerAccess` | Retrieves retailer-scoped product catalog |
| `GET` | `/api/cart` | Customer + `verifyRetailerAccess` | Retrieves active store cart items |
| `POST` | `/api/cart/items` | Customer + `verifyRetailerAccess` | Adds item to active store cart |
| `POST` | `/api/orders` | Customer + `verifyRetailerAccess` | Creates single-retailer order with validation |
| `GET` | `/api/orders` | Customer | Retrieves customer order history |
| `PUT` | `/api/orders/:id/fulfillment` | Manufacturer / Admin | Updates 7-stage order movement status |
| `POST` | `/api/orders/:id/dispatch` | Manufacturer | Adds logistics carrier, AWB code, & delivery date |

---

## 11. Security Threat Analysis & Anti-Enumeration Measures

1. **Anti-Enumeration Protection:**
   - Code validation endpoint `/api/retailers/validate-code` is rate-limited (max 10 requests per minute per IP).
   - Responses for invalid codes return uniform generic error messages without exposing retailer existence details.
2. **Parameter Tampering Defense:**
   - Passing an unauthorized `retailer_id` in headers, query parameters, or POST request bodies is intercepted by `verifyRetailerAccess` and rejected before database execution.
3. **Cart & Order Multi-Tenant Poisoning Defense:**
   - Order creation verifies that `cart.retailer_id == req.retailerId == product.retailer_id`. Any mismatch aborts order creation.

---

## 12. Data Migration Execution Architecture

Transitioning existing production database instances to Version 2.0 proceeds in 6 sequential phases:

```text
Phase 1: DDL Execution
  ├── Add retailers.retailer_code column & UNIQUE index
  ├── Create customer_retailers table & indexes
  └── Add carts.retailer_id column

Phase 2: Retailer Code Generation
  └── Populate unique public access codes for existing retailers (CJP-XXXXXX)

Phase 3: Customer-Retailer Backfill
  └── INSERT INTO customer_retailers (customer_id, retailer_id)
      SELECT DISTINCT customer_id, retailer_id FROM orders

Phase 4: Cart Scoping Backfill
  └── UPDATE carts SET retailer_id = (SELECT retailer_id FROM cart_items JOIN products...)

Phase 5: Constraint Enforcement & RLS Activation
  ├── Apply NOT NULL & FOREIGN KEY constraints
  └── Enable Row Level Security policies

Phase 6: Verification & Cutover
  └── Run validation audit scripts verifying zero orphan records before cutover
```

---

## 13. Architecture Summary
The updated Circular Junction Platform (CJP) Version 2.0 architecture establishes a robust, highly secure multi-tenant environment. By gating customer access behind unique retailer access codes (`CJP-XXXXXX`), isolating storefronts via `customer_retailers`, and enforcing verification across API middleware and Supabase Row Level Security (RLS) policies, CJP guarantees complete privacy and data isolation without sacrificing multi-tenant scalability or core supply chain capabilities.
