Product Requirements Document (PRD)
Circular Junction Platform (CJP) / Craftsman Jewellery Platform
Version: 1.0
Project Type: Full-Stack Web Application
Prepared By: Abhinand Viswam
Technology Stack: React.js (Vite), Node.js, Express.js, Supabase (PostgreSQL & Auth Storage), Tailwind CSS
________________________________________
1. Executive Summary
The Circular Junction Platform / Craftsman Jewellery Platform (CJP) is a sustainable fine jewellery e-commerce and supply chain platform designed to promote circular jewellery trade and multi-tier commerce by connecting manufacturers, retailers, and customers in a single unified ecosystem.
Unlike traditional e-commerce applications, CJP enables wholesale artisan cataloguing, retail store listing with custom markups, fine jewellery manufacturing lifecycle tracking, customer order fulfillment with logistics movement, and digital Gold SIP investment management alongside recycling and rewards.
The application supports four distinct user roles:
•	Customer
•	Manufacturer
•	Retailer
•	Administrator
Each role has dedicated dashboards, permissions, and specialized workflows.
________________________________________
2. Product Vision
To create a digital ecosystem that encourages sustainable consumption and transparent trade by enabling businesses and consumers to participate in responsible manufacturing, wholesale artisan listing, transparent retail store listing, order movement tracking, digital Gold SIP investments, and environmentally conscious recycling.
________________________________________
3. Problem Statement
Current online marketplaces primarily focus on basic product sales with limited support for fine jewellery supply chain transparency, post-purchase sustainability, and logistics movement.
Challenges include:
•	No structured recycling workflow or gold return mechanism
•	Lack of wholesale transparency regarding authentic manufacturer stock, purity specifications (18K/22K/24K), and wholesale pricing
•	No incentive for customers to recycle or invest in digital gold
•	Manufacturers lack visibility into order movement stages and returned products
•	Retailers have limited inventory, custom artisan listing, and sustainability tracking
•	Unstructured logistics tracking with missing carrier dispatch details and Air Waybill (AWB) tracking codes
The Circular Junction Platform addresses these issues by integrating multi-tier supply chain listing, order movement tracking, digital Gold SIPs, and recycling rewards into the shopping experience.
________________________________________
4. Product Goals
Primary Goals
1. Sustainable & Fine Jewellery Marketplace
Enable manufacturers to list environmentally friendly handcrafted fine jewellery products with detailed purity, weight, stone pricing, and making charges.
________________________________________
2. Circular Economy & Recycling
Allow customers to return recyclable products and gold items instead of discarding them.
________________________________________
3. Reward & Gold SIP System
Encourage recycling through reward points and provide customers accessible digital Gold SIP investment schemes backed by daily bullion rates.
________________________________________
4. Multi-role Platform
Provide separate portals and authorized dashboards for:
•	Customers
•	Manufacturers
•	Retailers
•	Administrators
________________________________________
5. Secure Authentication & Authorization
Provide role-based authentication using Supabase Auth and JWT authorization (`authenticate`, `authorize`).
________________________________________
6. Efficient Product & Order Management
Allow manufacturers to manage product catalogs independently, edit details reliably with input sanitization, purge/delete INACTIVE products, and manage order fulfillment movement across 7 lifecycle stages (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`) with logistics tracking (Carrier Name, AWB Tracking Code, Estimated Delivery Date).
________________________________________
7. Centralized Administration
Allow administrators to oversee users, products, categories, orders, gold rates, Gold SIP subscriptions, recycling requests, and rewards.
________________________________________
5. Success Metrics (KPIs)
Business KPIs
•	Number of registered users
•	Number of active manufacturers
•	Number of active retailers
•	Products and wholesale catalog items listed
•	Retailer store listings created
•	Orders placed and processed through the 7-stage movement pipeline
•	Active Gold SIP subscriptions and total gold bullion holdings
•	Recycling requests submitted
•	Rewards redeemed
________________________________________
Technical KPIs
•	API response time under 300 ms
•	99.9% uptime (deployment target)
•	Secure authentication and zero unauthorized cross-role access
•	No orphan records via target ID resolution during updates and deletions
•	Responsive UI across devices with zero build errors
________________________________________
6. Target Users
Customer
Responsibilities
•	Browse fine jewellery products by category, material (Gold, Silver, Platinum), purity (18K, 22K, 24K), price, and keywords
•	Purchase products using Cash on Delivery (COD) or simulated online checkout
•	Manage shopping cart
•	Place orders and track order fulfillment movement across 7 stages
•	View logistics tracking details (Carrier Name, AWB Tracking Code)
•	Subscribe to monthly Gold SIP schemes, pay installments, track digital gold wallet balance, and request redemption
•	Submit recycling requests
•	Earn reward points and receive role notifications
________________________________________
Manufacturer
Responsibilities
•	Manage product catalog (Create, Edit details, Delete/Purge INACTIVE products)
•	Set wholesale base price, gross weight (g), making charges, stone details, and purity
•	Upload product images to Supabase Storage
•	Track catalog inventory, stock status (`ACTIVE`, `OUT_OF_STOCK`, `INACTIVE`, `DISCONTINUED`), and dashboard metrics
•	View and manage incoming retailer/customer orders
•	Update order fulfillment movement across 7 sequential stages (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`)
•	Input dispatch logistics details (Logistics Carrier, AWB Tracking Code, Estimated Delivery Date) during shipment
•	Process recycling requests
________________________________________
Retailer
Responsibilities
•	Browse Master Manufacturer Wholesale Catalogue
•	Add manufacturer catalog items to Retailer Storefront with custom retail markup selling price (`selling_price`)
•	Create and manage custom In-House Retailer Artisan products and listings
•	Manage retail store inventory and stock availability
•	Create and manage Retailer Gold Schemes
•	Monitor store sales and order history
________________________________________
Administrator
Responsibilities
•	Manage users, manufacturers, and retailers (approval, activation, status toggle)
•	Manage product categories (CRUD operations)
•	Monitor products and store listings
•	Set daily global Gold Bullion market prices and view price history logs
•	Oversee Gold SIP subscriptions, customer gold balances, and transaction ledgers
•	View orders and platform analytics
•	Handle recycling requests
•	Manage rewards
•	Send notifications
________________________________________
7. User Personas
Persona 1
Eco-conscious & Fine Jewellery Customer
Needs
•	Authentic jewellery and sustainable products
•	Easy ordering and cart management
•	Order movement tracking with carrier dispatch details
•	Digital Gold SIP investment and wallet tracking
•	Recycling support
•	Reward incentives
________________________________________
Persona 2
Master Manufacturer / Artisan
Needs
•	Product catalog CRUD management (weight, purity, making charges, pricing)
•	Input sanitization and reliable product edit saving
•	Hard purge / deletion of inactive products
•	Order fulfillment movement tracking across 7 stages
•	Logistics dispatch input (Carrier Name, AWB Number, Delivery Date)
•	Dashboard analytics (Total catalog, Active inventory, Out of stock, Stock value)
•	Recycling participation
________________________________________
Persona 3
Retail Store Owner
Needs
•	Wholesale catalog visibility
•	Adding manufacturer items to store with dynamic retail pricing markup
•	Custom in-house product creation
•	Inventory visibility and stock monitoring
•	Retailer Gold Schemes management
________________________________________
Persona 4
Platform Administrator
Needs
•	Complete platform management and role moderation
•	Daily Gold rate setting and historical logs
•	Gold SIP and holdings overview
•	Reporting and analytics
•	User moderation and category management
________________________________________
8. Scope
In Scope (MVP)
Authentication
•	Login
•	Signup
•	Logout
•	Password reset
•	Role-based authentication (`authenticate`, `authorize`)
•	Session management
________________________________________
User Management
•	Profile management
•	Role assignment (Customer, Manufacturer, Retailer, Admin)
•	Status management (Active, Inactive, Pending Approval)
________________________________________
Product Management
•	Create product
•	Edit product details (Name, Description, Category, Material, Purity, Weight, Price, Making Charge, Stone Details, Stock, Status) with input sanitization (stripping `₹`, commas, `"g"`)
•	Delete product & purge INACTIVE products across all database tables (`products`, `manufacturer_products`, `retailer_products`, `product_images`)
•	Target ID resolution mapping retailer product IDs to master manufacturer products
•	Product image uploads to Supabase Storage
•	Categories management
•	Search products
•	Filters (Category, Price, Material, Purity, Status)
•	Product details modal
________________________________________
Retailer Store Features
•	Browse Master Manufacturer Wholesale Catalog
•	List manufacturer products into Retailer Store with dynamic retail selling price (`selling_price`)
•	Add custom In-House Retailer Artisan products
•	Retail store inventory management
•	Retailer Gold Schemes management
________________________________________
Customer Features
•	Browse products
•	Product search
•	Product filters
•	Cart management
•	Checkout (Cash on Delivery & Simulated Payment)
•	Orders & Order history
•	Order details with 7-stage movement progress bar
•	Logistics tracking details (Carrier Name, AWB Tracking Code, Estimated Delivery Date)
•	Digital Gold Wallet balance & Gold SIP investments (enrollment, installment payment, gold redemption)
________________________________________
Manufacturer Features
•	Dashboard metrics (Total Catalog, Active Inventory, Out of Stock, Total Stock Value)
•	Product CRUD & Catalogue management
•	Product statistics & inventory status
•	Order fulfillment movement pipeline (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`)
•	Logistics Dispatch Modal (Carrier Company, AWB Tracking Code, Estimated Delivery Date)
________________________________________
Retailer Features
•	Dashboard & Store metrics
•	Product inventory & Store listings
•	Assigned products & wholesale catalog browsing
•	Custom artisan product management
________________________________________
Admin Features
•	User & Partner management (Manufacturers, Retailers)
•	Product & Listing moderation
•	Category management
•	Daily Gold Rate management & price logs
•	Gold SIP subscriptions & Holdings ledger
•	Dashboard analytics & system reports
•	Recycling request management
________________________________________
Recycling Module
•	Submit request
•	Track request
•	Approve / Reject
•	Complete recycling & reward points
________________________________________
Gold SIP & Wallet Module
•	Daily gold rate setting
•	SIP plan enrollment & installment payments
•	Digital Gold Wallet holdings in grams & asset value calculation
•	Gold redemption workflow
________________________________________
Rewards
•	Earn points
•	Reward history & redemption
________________________________________
Notifications
•	In-app notifications
•	Order status update notifications
•	Recycling updates
________________________________________
Security
•	Role-based authorization middleware
•	JWT validation
•	Protected API endpoints
________________________________________
Storage
•	Product image upload to Supabase Storage
•	Profile image upload
________________________________________
9. Out of Scope (Version 1.0)
To prevent scope creep, the following features are explicitly excluded:
Payments
•	Live payment gateway integration (Stripe, Razorpay, PayPal live keys)
•	Refund processing
Instead:
•	Simulated payment or Cash on Delivery (COD).
________________________________________
Logistics
•	Live courier API Webhook integration (manual input via Manufacturer Dispatch Modal is used)
•	Automated delivery partner dispatch APIs
________________________________________
AI Features
•	Product recommendations
•	Chatbot
•	Image recognition
•	Demand prediction
________________________________________
Social Features
•	Product reviews
•	Product ratings
•	Comments
•	Likes
•	Sharing
________________________________________
Marketplace Features
•	Auctions
•	Bidding
•	Multi-vendor commissions
•	Subscription plans
________________________________________
Communication
•	Live chat
•	Video calls
•	Voice support
________________________________________
Marketing
•	Coupons
•	Promotional campaigns
•	Referral programs
•	Affiliate system
________________________________________
Advanced Analytics
•	Machine learning dashboards
•	Business intelligence reports
•	Predictive analytics
________________________________________
Mobile Applications
•	Android app
•	iOS app
•	React Native version
________________________________________
Offline Support
•	Progressive Web App (PWA)
•	Offline synchronization
________________________________________
Multi-language
•	Localization
•	Internationalization
________________________________________
Multi-currency
•	Currency conversion (INR `₹` is standard)
________________________________________
Blockchain
•	NFT certificates
•	Blockchain supply chain
________________________________________
Carbon Offset Marketplace
Not included in Version 1.
________________________________________
IoT Integration
Not included.
________________________________________
10. Functional Requirements
Authentication
FR-01 User signup
FR-02 User login
FR-03 Logout
FR-04 Role authorization (`authenticate`, `authorize`)
________________________________________
Products
FR-05 Create product
FR-06 Edit product details with input sanitization (parsing prices, weights, category matching)
FR-07 Delete product & purge INACTIVE products across all database tables
FR-08 Upload product images to Supabase Storage
FR-09 Search products
FR-10 Filter products by Category, Price, Material, Purity, Status
FR-11 Retailers list manufacturer items in store with custom retail selling price (`selling_price`)
FR-12 Create custom In-House Retailer Artisan products
________________________________________
Cart
FR-13 Add to cart
FR-14 Update quantity
FR-15 Remove product
FR-16 Checkout (Cash on Delivery & Simulated Payment)
________________________________________
Orders & Fulfillment Movement
FR-17 Create order
FR-18 Cancel order (allowed while status is `PENDING`)
FR-19 View order history & order details
FR-20 Update order fulfillment movement across 7 lifecycle stages (`PENDING` → `ACCEPTED` → `PROCESSING` → `PACKAGING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `DELIVERED`)
FR-21 Dispatch order with logistics metadata (Carrier Name, AWB Tracking Code, Estimated Delivery Date)
FR-22 Display order movement progress bar & tracking info
________________________________________
Digital Gold SIP & Wallet
FR-23 Admin set daily Gold Bullion market rate per gram
FR-24 Customer enroll in Gold SIP scheme & pay installments
FR-25 Track digital Gold Wallet balance (grams & net asset value)
FR-26 Request Gold Redemption
________________________________________
Recycling
FR-27 Create recycling request
FR-28 Update status & reward customer
________________________________________
Notifications
FR-29 Send role notifications for order status updates
FR-30 Read notification
________________________________________
11. Non-Functional Requirements
Performance
•	API response under 300 ms
•	Page load under 3 seconds
Scalability
•	Support thousands of users
•	Modular backend controller & service architecture
Security
•	HTTPS
•	JWT authentication
•	Role-based access control
•	Password hashing (managed by Supabase Auth)
•	Input validation and sanitization
Reliability
•	Database backups
•	Target ID resolution preventing orphan records
•	Error logging and safe column retry fallbacks
Availability
•	99.9% uptime target
Usability
•	Responsive design across desktop, tablet, and mobile
•	Accessible UI with clean status badges and modal feedback
•	Consistent navigation
Maintainability
•	Modular codebase
•	RESTful APIs
•	Clean folder structure
•	Reusable React components
________________________________________
12. Assumptions
•	Users have internet connectivity.
•	Manufacturers provide accurate product, weight, purity, and pricing information.
•	Retailers provide accurate retail selling prices.
•	Customers submit valid recycling requests and order details.
•	Product images comply with platform guidelines.
•	Administrators review flagged content and update daily gold bullion rates manually.
________________________________________
13. Constraints
•	Supabase is used for authentication, PostgreSQL database, and Storage buckets.
•	React.js (Vite) is the frontend framework.
•	Node.js and Express.js provide backend REST APIs.
•	Tailwind CSS / Vanilla CSS is used for styling.
•	Image storage is handled through Supabase Storage (`product-images`).
•	Only web browsers are supported in Version 1.0.
________________________________________
14. Risks
Risk	Impact	Mitigation
Unauthorized access	High	Role-based middleware (`authenticate`, `authorize`), JWT verification
Invalid product or numeric input data	Medium	Client-side & server-side input sanitization (stripping symbols/units)
Image upload failures	Medium	File validation, Supabase storage integration, fallback placeholder images
Large image storage usage	Medium	File size limits and image compression
Database performance & FK constraint conflicts	Medium	Indexing, target ID resolution, dual-schema sync, safe column fallbacks
Scope creep	High	Strict adherence to the defined MVP and out-of-scope list
________________________________________
15. Release Plan
Phase 1 (MVP)
•	Authentication & Role Authorization
•	User & Profile Management
•	Wholesale Product Management (CRUD, Edit sanitization, Inactive Purge)
•	Retailer Store Listings & Dynamic Pricing Markup
•	Customer Shopping, Cart & Checkout
•	Order Lifecycle & Fulfillment Movement Engine (7 stages, Logistics Dispatch Modal with Carrier/AWB info)
•	Digital Gold SIP & Wallet Module
•	Recycling Requests & Rewards
•	Role Notifications
•	Admin Dashboard, Gold Rate Setting & User Moderation
Phase 2
•	Live Payment Gateway Integration (Stripe, Razorpay)
•	Live Courier API Webhook Integration
•	Product Reviews & Ratings
•	Advanced Retailer Analytics
Phase 3
•	AI Recommendations & Chatbot
•	Mobile Applications (iOS / Android)
•	Multi-language & Multi-currency Support
•	Advanced Sustainability & Supply Chain Analytics
________________________________________
16. Acceptance Criteria
The MVP will be considered complete when:
•	All four user roles (Customer, Manufacturer, Retailer, Administrator) can authenticate and access only their authorized features.
•	Manufacturers can manage products (create, edit details reliably, delete/purge inactive items) and upload images.
•	Retailers can browse wholesale catalogs and list items into their store with custom retail markup selling prices.
•	Customers can browse products, manage a cart, place orders, track order movement across 7 fulfillment stages, and view logistics tracking numbers.
•	Manufacturers can dispatch orders using the Dispatch & Logistics Modal with carrier and tracking info.
•	Customers can manage Gold SIP investments and track real-time gold wallet balances.
•	Recycling requests can be submitted, tracked, and processed with reward points awarded.
•	Administrators can manage users, categories, daily gold rates, SIP subscriptions, orders, and recycling requests.
•	Notifications are delivered for key order status updates.
•	All major workflows are tested successfully, and the application is responsive, secure, and deployable.
This PRD defines the scope for Version 1.0 (MVP) and should be used as the baseline for development. Any new feature request should be evaluated against the Out of Scope section before being accepted to avoid unnecessary scope expansion.
