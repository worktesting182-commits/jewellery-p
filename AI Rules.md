AI Rules Document
Circular Junction Platform (CJP)
Version: 1.0
Purpose: Define mandatory development rules, coding standards, security requirements, architectural constraints, and AI-assisted coding guidelines to ensure consistency, maintainability, and security throughout the project.
________________________________________
1. Purpose
This document establishes non-negotiable rules that all AI-generated and developer-written code must follow.
These rules are mandatory for every feature, API, component, and database operation.
________________________________________
2. General Rules
GR-01
Never break the existing project architecture.
________________________________________
GR-02
Follow the existing folder structure.
________________________________________
GR-03
Do not duplicate business logic.
Use reusable services, utilities, and components.
________________________________________
GR-04
All code must be modular.
________________________________________
GR-05
No hardcoded values except application constants.
________________________________________
GR-06
Use descriptive variable and function names.
Example
Good
createProduct()
Bad
cp()
________________________________________
GR-07
Every API must include error handling.
________________________________________
GR-08
Every database operation must validate input before execution.
________________________________________
3. Technology Constraints
Only these technologies are allowed.
Frontend
•	React.js
•	Vite
•	Tailwind CSS
•	React Router
•	Axios
•	React Icons
Do not introduce additional frontend frameworks without approval.
________________________________________
Backend
Allowed
•	Node.js
•	Express.js
•	Supabase JS SDK
•	dotenv
•	JWT
•	bcrypt (if needed outside Supabase Auth)
Do not introduce ORM frameworks unless approved.
________________________________________
Database
Only
•	Supabase PostgreSQL
Do not use:
•	MongoDB
•	MySQL
•	Firebase
•	SQLite
________________________________________
Authentication
Only
Supabase Authentication
Do not implement custom password authentication.
________________________________________
4. Security Rules
SR-01 API Keys
Main API Keys MUST NEVER be exposed.
Forbidden
const apiKey = "xxxxxxxx";
Forbidden
VITE_SUPABASE_SERVICE_ROLE_KEY=xxxx
Allowed
SUPABASE_SERVICE_ROLE_KEY=xxxx
The Service Role Key must exist only on the backend and must never be sent to the browser.
________________________________________
SR-02 Environment Variables
Sensitive information must be stored only in .env files.
Examples:
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
Frontend should only use public variables:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
Never expose:
•	Service Role Key
•	JWT Secret
•	Database passwords
•	Third-party API secrets
________________________________________
SR-03 Git Ignore
Never commit:
.env
.env.local
node_modules
dist
build
________________________________________
SR-04 SQL Injection
Never concatenate SQL queries manually.
Always use:
•	Supabase query builder
•	Parameterized queries
________________________________________
SR-05 Input Validation
Every API must validate:
•	Required fields
•	Data types
•	Length limits
•	Numeric ranges
•	Enum values
________________________________________
SR-06 Authentication
Every protected endpoint must verify:
•	JWT
•	Authenticated user
•	User role
________________________________________
SR-07 Authorization
Never trust frontend permissions.
Every backend API must verify user roles.
________________________________________
SR-08 Resource Ownership
Users must only access their own resources.
Example:
Customer A
Cannot view
Customer B's
•	Orders
•	Cart
•	Rewards
•	Recycling Requests
________________________________________
SR-09 Passwords
Passwords must never be:
•	Stored manually
•	Logged
•	Returned in API responses
Authentication is handled entirely by Supabase Auth.
________________________________________
SR-10 Error Messages
Never expose:
•	Database schema
•	SQL errors
•	Stack traces
•	API secrets
Return generic error messages to clients.
________________________________________
5. API Rules
Every endpoint must follow REST conventions.
Example
GET

POST

PUT

DELETE
No action-based endpoints like:
/createProduct
Use
POST /products
________________________________________
Response Format
Success
{
    "success": true,
    "message": "",
    "data": {}
}
Failure
{
    "success": false,
    "message": ""
}
________________________________________
Status Codes
200
201
400
401
403
404
409
500
________________________________________
6. Database Rules
Primary keys
UUID
Foreign keys
Mandatory
Indexes
Required on
•	user_id
•	category_id
•	manufacturer_id
•	order_id
•	product_id
________________________________________
Soft deletes are preferred for critical business entities in future versions; physical deletes are acceptable for MVP where appropriate.
________________________________________
7. Frontend Rules
Use
Functional Components
Use
React Hooks
Avoid
Class Components
________________________________________
Every page must have
•	Loading state
•	Error state
•	Empty state
________________________________________
Routing
Must use
React Router
________________________________________
Forms
Validate before API calls.
________________________________________
8. Backend Rules
Controllers
Only request handling.
Business logic belongs in services.
Routes
Only routing.
Validation
Separate validation layer where possible.
________________________________________
9. File Upload Rules
Allowed
•	JPG
•	PNG
•	WEBP
Maximum
5 MB
Store only the URL in the database.
Files must be uploaded to:
•	Supabase Storage
________________________________________
10. Image Rules
Compress large images before upload if possible.
Generate unique file names.
Do not overwrite existing files.
________________________________________
11. Logging Rules
Never log:
•	Passwords
•	API Keys
•	Tokens
•	Secrets
•	Personal payment information
Allowed
•	Request ID
•	Endpoint
•	Status Code
•	Timestamp
•	Error ID
________________________________________
12. Performance Rules
Pagination required for:
•	Products
•	Orders
•	Notifications
Lazy loading
Required for dashboard routes.
Optimize database queries.
Avoid unnecessary re-renders in React.
________________________________________
13. Coding Standards
Naming
camelCase
Functions
Single responsibility.
Maximum recommended function length
~50 lines
Avoid deeply nested logic.
________________________________________
14. UI Rules
Responsive
Required.
Accessibility
Use semantic HTML.
Consistent spacing and typography.
Provide user feedback for:
•	Loading
•	Success
•	Errors
________________________________________
15. Testing Rules
Every new API should be tested.
Test cases should include:
•	Success
•	Validation failure
•	Unauthorized access
•	Forbidden access
•	Resource not found
________________________________________
16. Deployment Rules
Frontend
•	Vercel or Netlify
Backend
•	Render or Railway
Database
•	Supabase
Production environment variables must be configured through the hosting platform, not hardcoded.
________________________________________
17. AI Coding Rules
The AI must:
•	Follow the existing project architecture.
•	Reuse existing components and utilities before creating new ones.
•	Preserve backward compatibility unless explicitly instructed otherwise.
•	Generate production-ready code with validation and error handling.
•	Follow RESTful API conventions.
•	Maintain consistent naming conventions and folder structure.
The AI must not:
•	Introduce new frameworks without approval.
•	Expose secrets or API keys.
•	Remove existing security checks.
•	Bypass authentication or authorization.
•	Generate placeholder credentials or fake secrets.
•	Duplicate business logic already implemented elsewhere.
________________________________________
18. Documentation Rules
Every new module should include:
•	Purpose
•	API endpoints (if applicable)
•	Inputs and outputs
•	Dependencies
•	Error scenarios
Major architectural changes must be reflected in the Architecture Document and PRD.
________________________________________
19. Code Review Checklist
Before merging any feature, verify:
•	✅ No secrets or API keys exposed.
•	✅ .env files are excluded from version control.
•	✅ Input validation implemented.
•	✅ Authentication and authorization enforced.
•	✅ REST conventions followed.
•	✅ Error handling added.
•	✅ Loading, error, and empty states implemented in the UI.
•	✅ Database relationships maintained.
•	✅ No duplicated code.
•	✅ Project structure remains consistent.
•	✅ Feature aligns with the PRD and is not out of scope.
________________________________________
20. Non-Negotiable Rules
1.	Never expose API keys, Service Role Keys, JWT secrets, or database credentials.
2.	Never access the database directly from the frontend using privileged credentials.
3.	All sensitive operations must go through the backend.
4.	Every protected API must verify authentication and role-based authorization.
5.	All inputs must be validated on the backend.
6.	Use only the approved technology stack for the MVP.
7.	Follow the defined architecture, folder structure, and coding standards.
8.	Any feature outside the approved PRD must be reviewed before implementation.
9.	Code must be secure, maintainable, reusable, and production-ready.
10.	Security, data integrity, and maintainability take precedence over development speed.

