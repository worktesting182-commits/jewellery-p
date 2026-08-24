NEW Architecture Document

Architecture Document
Circular Junction Platform (CJP)
Version: 1.0
Architecture Style: Three-Tier Web Architecture (Client–Server)
Project Type: Full-Stack Sustainable E-Commerce Platform
Frontend: React.js + Vite + Tailwind CSS
Backend: Node.js + Express.js
Database & Authentication: Supabase (PostgreSQL + Auth + Storage)
________________________________________
1. Purpose
This Architecture Document defines the overall technical architecture of the Circular Junction Platform (CJP), including the system components, technology stack, data flow, security model, deployment strategy, and design principles.
It serves as the technical blueprint for developers and stakeholders to ensure a scalable, maintainable, and secure implementation.
________________________________________
2. System Overview
The Circular Junction Platform is a role-based web application that enables:
•	Customers to browse, purchase, and recycle products.
•	Manufacturers to manage eco-friendly products and inventory.
•	Retailers to monitor inventory and assigned products.
•	Administrators to manage the platform, users, orders, and recycling requests.
The application follows a three-tier architecture:
1.	Presentation Layer (Frontend)
2.	Application Layer (Backend)
3.	Data Layer (Supabase)
________________________________________
3. High-Level Architecture
                        Users
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Customer         Manufacturer        Admin/Retailer
                           │
                    React Frontend
                           │
             HTTPS REST API Requests
                           │
                    Express.js Backend
                           │
     ┌───────────────┬───────────────┬───────────────┐
     │               │               │
 Supabase Auth   PostgreSQL DB   Supabase Storage
     │               │               │
 Authentication   Business Data   Product Images
________________________________________
4. Architecture Pattern
The system follows:
•	Layered Architecture
•	RESTful API Architecture
•	Component-Based Frontend
•	Role-Based Access Control (RBAC)
________________________________________
5. Technology Stack
Frontend
Technology	Purpose
React.js	User Interface
Vite	Build Tool
Tailwind CSS	Styling
React Router	Navigation
Axios	API Communication
React Icons	Icons
________________________________________
Backend
Technology	Purpose
Node.js	Runtime
Express.js	REST API
Supabase JS SDK	Database & Auth Integration
dotenv	Environment Variables
CORS	Cross-Origin Requests
JWT	Token Validation
________________________________________
Database
Technology	Purpose
Supabase PostgreSQL	Relational Database
Supabase Auth	Authentication
Supabase Storage	Image Storage
________________________________________
Development Tools
•	Git
•	GitHub
•	Postman / Thunder Client
•	VS Code
________________________________________
6. Layered Architecture
Presentation Layer
Responsibilities:
•	User Interface
•	Forms
•	Dashboard
•	Routing
•	State Management
•	API Calls
Modules:
•	Authentication
•	Customer Dashboard
•	Manufacturer Dashboard
•	Retailer Dashboard
•	Admin Dashboard
________________________________________
Application Layer
Responsibilities:
•	Business Logic
•	Validation
•	Authorization
•	REST APIs
•	Error Handling
Modules:
•	Authentication
•	Users
•	Products
•	Categories
•	Cart
•	Orders
•	Recycling
•	Rewards
•	Notifications
________________________________________
Data Layer
Responsibilities:
•	Data Storage
•	Authentication
•	File Storage
•	Relationships
•	Constraints
________________________________________
7. Frontend Architecture
src/
│
├── api/
│
├── assets/
│
├── components/
│   ├── common/
│   ├── customer/
│   ├── manufacturer/
│   ├── retailer/
│   └── admin/
│
├── context/
│
├── hooks/
│
├── layouts/
│
├── pages/
│
├── routes/
│
├── utils/
│
├── lib/
│
└── App.jsx
________________________________________
8. Backend Architecture
backend/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
├── validations/
│
├── uploads/
│
│
├── server.js
└── package.json
________________________________________
9. Database Architecture
Main Tables
users

customers

manufacturers

retailers

categories

products

product_images

carts

orders

order_items

recycling_requests

rewards

notifications
________________________________________
10. Entity Relationships
Users
│
├── Customer
│      │
│      ├── Cart
│      ├── Orders
│      ├── Rewards
│      └── Recycling Requests
│
├── Manufacturer
│      │
│      └── Products
│
├── Retailer
│
└── Notifications

Products
│
├── Category
├── Product Images
└── Order Items
________________________________________
11. Authentication Architecture
Authentication is handled by Supabase Auth.
Workflow:
Signup

↓

Supabase Auth

↓

auth.users

↓

public.users

↓

Role Table
Login Flow
User Login

↓

Supabase Auth

↓

JWT Token

↓

Frontend Stores Session

↓

Protected API Calls
________________________________________
12. Authorization
Role-Based Access Control (RBAC)
Role	Permissions
Customer	Browse, Cart, Orders, Recycling
Manufacturer	Product Management
Retailer	Inventory
Admin	Full Access
Middleware checks:
•	Authentication
•	User Role
•	Resource Ownership (e.g., customers only access their own orders)
________________________________________
13. API Architecture
RESTful API Structure
/api/auth

/api/users

/api/categories

/api/products

/api/cart

/api/orders

/api/recycling

/api/rewards

/api/notifications
Response Format
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
________________________________________
14. Data Flow
Product Purchase
Customer

↓

Frontend

↓

Products API

↓

Database

↓

Cart

↓

Checkout

↓

Orders

↓

Reduce Stock

↓

Clear Cart
________________________________________
Recycling
Customer

↓

Submit Request

↓

Database

↓

Admin Review

↓

Manufacturer Processing

↓

Completed

↓

Reward Points
________________________________________
15. File Storage
Supabase Storage Bucket
product-images/

profile-images/
Supported Formats
•	JPG
•	PNG
•	WEBP
Maximum Size
•	5 MB per image
________________________________________
16. Security Architecture
Authentication
•	Supabase Auth
•	JWT-based sessions
Authorization
•	Role-based middleware
•	Resource ownership validation
Data Protection
•	HTTPS
•	Environment variables
•	Server-side validation
•	Parameterized database queries
•	Input sanitization
Storage Security
•	Public bucket for product images (read-only)
•	Authenticated access for profile images (optional)
________________________________________
17. Error Handling
Centralized error middleware.
HTTP Status Codes
Code	Meaning
200	Success
201	Created
400	Bad Request
401	Unauthorized
403	Forbidden
404	Not Found
409	Conflict
500	Internal Server Error
________________________________________
18. Logging Strategy
Application logs:
•	API requests
•	Authentication events
•	Validation failures
•	Database errors
Future enhancements:
•	Winston/Pino logging
•	Monitoring dashboards
•	Audit logs for admin actions
________________________________________
19. Performance Considerations
Database
•	Index foreign keys
•	Index frequently searched columns (e.g., product name, category)
•	Use pagination for product and order listings
Frontend
•	Lazy load routes
•	Optimize images
•	Cache static assets
Backend
•	Validate input early
•	Keep controllers thin; move business logic to services
•	Minimize database round trips
________________________________________
20. Deployment Architecture
Users

↓

Frontend (Vercel / Netlify)

↓

HTTPS

↓

Backend (Render / Railway)

↓

Supabase

├── PostgreSQL
├── Auth
└── Storage
________________________________________
21. Scalability
The architecture supports:
•	Additional user roles
•	Payment gateway integration
•	Mobile applications
•	AI recommendations
•	Analytics dashboards
•	Microservice migration in the future
________________________________________
22. Design Principles
•	Separation of Concerns
•	Single Responsibility Principle
•	RESTful API Design
•	Modular Components
•	Reusable Services
•	Role-Based Security
•	Responsive UI
•	Maintainable Code Structure
________________________________________
23. Assumptions
•	Stable internet connection for users.
•	Supabase services are available.
•	Images are uploaded through Supabase Storage.
•	Email authentication is enabled.
•	The MVP targets modern desktop and mobile browsers.
________________________________________
24. Risks & Mitigation
Risk	Impact	Mitigation
Unauthorized API access	High	JWT validation + RBAC middleware
Database performance degradation	Medium	Indexing, optimized queries, pagination
Large image uploads	Medium	File size/type validation
Accidental data deletion	High	Soft deletes (future), backups
Service outage	Medium	Retry mechanisms, graceful error handling
Scope creep	High	Strict adherence to the PRD and MVP scope
________________________________________
25. Future Architecture Enhancements
Planned for post-MVP releases:
•	Payment gateway integration (Razorpay/Stripe)
•	Real-time notifications
•	Email and SMS services
•	Product reviews and ratings
•	AI-powered recommendations
•	Mobile applications (React Native)
•	Advanced analytics and reporting
•	Multi-language and multi-currency support
•	Background job processing (e.g., notifications, scheduled tasks)
•	CDN integration for media assets
________________________________________
26. Architecture Summary
The Circular Junction Platform adopts a modular three-tier architecture with a React frontend, Express.js backend, and Supabase-managed services for authentication, PostgreSQL database, and storage. The design emphasizes security, scalability, maintainability, and clear separation of concerns, providing a solid foundation for the MVP while allowing future enhancements without major architectural changes.

