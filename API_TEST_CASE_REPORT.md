# API Test Case Report

## Backend

| Item | Value |
|---|---|
| Stack | Node.js, Express.js, Supabase PostgreSQL, JWT Authentication, ES Modules |
| Base Path | `/api` |
| Scope | Authentication, user profile, product APIs |

## Positive Test Cases

| Module | Method | Endpoint | Test Case | Preconditions | Request / Action | Expected Result |
|---|---:|---|---|---|---|---|
| Auth | POST | `/api/auth/signup` | Signup customer successfully | Valid Supabase config and role tables exist | Send valid `full_name`, `email`, `password`, `phone`, `role: CUSTOMER` | `201`, `success: true`, user profile returned |
| Auth | POST | `/api/auth/signup` | Signup manufacturer successfully | Valid Supabase config and role tables exist | Send valid body with `role: MANUFACTURER` | `201`, user created in `users` and `manufacturers` |
| Auth | POST | `/api/auth/signup` | Signup retailer successfully | Valid Supabase config and role tables exist | Send valid body with `role: RETAILER` | `201`, user created in `users` and `retailers` |
| Auth | POST | `/api/auth/login` | Login successfully | Existing confirmed user | Send valid `email` and `password` | `200`, returns `access_token`, `refresh_token`, and user details |
| Auth | POST | `/api/auth/logout` | Logout successfully | Logged-in user | Send `Authorization: Bearer <valid_token>` | `200`, `success: true` |
| Users | GET | `/api/users/profile` | Get own profile | Logged-in user | Send valid bearer token | `200`, own profile returned |
| Users | PUT | `/api/users/profile` | Update own profile | Logged-in user | Send valid profile fields | `200`, updated profile returned |
| Products | GET | `/api/products` | List products | Products may or may not exist | Send request | `200`, product array returned |
| Products | GET | `/api/products/:id` | Get product by ID | Product exists | Send valid product ID | `200`, product returned |
| Products | POST | `/api/products` | Create product | Logged-in manufacturer with manufacturer profile | Send valid product payload | `201`, product created |
| Products | PUT | `/api/products/:id` | Update own product | Logged-in manufacturer owns product | Send allowed product fields | `200`, product updated |
| Products | DELETE | `/api/products/:id` | Delete own product | Logged-in manufacturer owns product | Send valid product ID | `200`, product deleted |

## Negative Test Cases

| Module | Method | Endpoint | Test Case | Request / Setup | Expected Result |
|---|---:|---|---|---|---|
| Auth | POST | `/api/auth/signup` | Duplicate email | Use an already registered email | `400`, duplicate user error |
| Auth | POST | `/api/auth/signup` | Invalid email | Send `email: "invalid-email"` | `400`, validation or Supabase error |
| Auth | POST | `/api/auth/signup` | Weak password | Send password below Supabase policy | `400`, password policy error |
| Auth | POST | `/api/auth/signup` | Invalid role | Send `role: ADMIN` or `role: HACKER` | `400`, invalid role |
| Auth | POST | `/api/auth/login` | Wrong password | Existing email with wrong password | `401`, login denied |
| Auth | POST | `/api/auth/login` | Unknown email | Nonexistent email | `401`, login denied |
| Auth | POST | `/api/auth/logout` | Logout without token | No authorization header | `401`, authorization header missing |
| Auth | POST | `/api/auth/logout` | Logout with invalid token | Send `Authorization: Bearer invalid` | `401`, invalid or expired token |
| Users | GET | `/api/users/profile` | Profile without token | No authorization header | `401` |
| Users | PUT | `/api/users/profile` | Update without token | No authorization header | `401` |
| Products | POST | `/api/products` | Create product without token | No authorization header | `401` |
| Products | PUT | `/api/products/:id` | Update product without token | No authorization header | `401` |
| Products | DELETE | `/api/products/:id` | Delete product without token | No authorization header | `401` |
| Products | PUT | `/api/products/:id` | Update another manufacturer's product | Manufacturer token, product owned by someone else | Request denied or no matching product updated |
| Products | DELETE | `/api/products/:id` | Delete another manufacturer's product | Manufacturer token, product owned by someone else | Request denied or no matching product deleted |

## Validation Test Cases

| Module | Method | Endpoint | Test Case | Request Body / Param | Expected Result |
|---|---:|---|---|---|---|
| Auth | POST | `/api/auth/signup` | Missing full name | No `full_name` | `400`, required fields error |
| Auth | POST | `/api/auth/signup` | Missing email | No `email` | `400`, required fields error |
| Auth | POST | `/api/auth/signup` | Missing password | No `password` | `400`, required fields error |
| Auth | POST | `/api/auth/signup` | Missing role | No `role` | `400`, required fields error |
| Auth | POST | `/api/auth/login` | Missing email | No `email` | `400`, required fields error |
| Auth | POST | `/api/auth/login` | Missing password | No `password` | `400`, required fields error |
| Users | PUT | `/api/users/profile` | Valid profile update | `full_name`, `phone`, `profile_image` | `200`, profile updated |
| Users | PUT | `/api/users/profile` | Empty profile update | `{}` | Prefer `400`; current DB behavior may decide |
| Users | PUT | `/api/users/profile` | Invalid phone format | `phone: "abc"` | Prefer `400` if validation exists |
| Products | POST | `/api/products` | Missing product name | No `name` | `400` if DB requires |
| Products | POST | `/api/products` | Missing category | No `category_id` | `400` if DB requires |
| Products | POST | `/api/products` | Invalid category ID | Nonexistent category ID | `400`, foreign-key or validation error |
| Products | POST | `/api/products` | Negative price | `price: -1` | Prefer `400`; DB constraint should enforce |
| Products | POST | `/api/products` | Negative stock | `stock_quantity: -5` | Prefer `400`; DB constraint should enforce |
| Products | POST | `/api/products` | Invalid boolean | `is_recyclable: "yes"` | `400` if type validation fails |
| Products | PUT | `/api/products/:id` | Update allowed fields | `price`, `stock_quantity`, `status` | `200`, fields updated |
| Products | PUT | `/api/products/:id` | Update disallowed field | `manufacturer_id` | Ignored or rejected; owner unchanged |
| Products | PUT | `/api/products/:id` | Empty update body | `{}` | `400`, no valid product fields provided |
| Products | GET | `/api/products/:id` | Invalid product ID format | Bad `id` | `400` or `404` |
| Products | GET | `/api/products/:id` | Nonexistent product ID | Valid but missing ID | `404` |

## Authentication Test Cases

| Module | Method | Endpoint | Test Case | Token / Header | Expected Result |
|---|---:|---|---|---|---|
| Auth | POST | `/api/auth/logout` | Valid token | `Authorization: Bearer <valid_token>` | `200` |
| Auth | POST | `/api/auth/logout` | Missing token | No authorization header | `401` |
| Auth | POST | `/api/auth/logout` | Malformed token format | `Authorization: Token <token>` | `401` |
| Auth | POST | `/api/auth/logout` | Expired token | Expired JWT | `401` |
| Users | GET | `/api/users/profile` | Valid token | Valid bearer token | `200` |
| Users | GET | `/api/users/profile` | Missing token | No authorization header | `401` |
| Users | GET | `/api/users/profile` | Invalid token | Random string token | `401` |
| Users | PUT | `/api/users/profile` | Valid token | Valid bearer token | `200` |
| Products | POST | `/api/products` | Valid manufacturer token | Valid manufacturer bearer token | `201` |
| Products | POST | `/api/products` | Expired manufacturer token | Expired JWT | `401` |
| Products | PUT | `/api/products/:id` | Valid manufacturer token | Valid manufacturer bearer token | `200` |
| Products | DELETE | `/api/products/:id` | Valid manufacturer token | Valid manufacturer bearer token | `200` |

## Authorization Test Cases

| Module | Method | Endpoint | Test Case | Role | Expected Result |
|---|---:|---|---|---|---|
| Products | POST | `/api/products` | Manufacturer creates product | `MANUFACTURER` | `201` |
| Products | POST | `/api/products` | Customer creates product | `CUSTOMER` | `403` |
| Products | POST | `/api/products` | Retailer creates product | `RETAILER` | `403` |
| Products | POST | `/api/products` | Admin creates product | `ADMIN` | `403` unless explicitly allowed |
| Products | PUT | `/api/products/:id` | Manufacturer updates own product | `MANUFACTURER` owner | `200` |
| Products | PUT | `/api/products/:id` | Manufacturer updates other product | `MANUFACTURER` non-owner | Request denied or no matching product updated |
| Products | DELETE | `/api/products/:id` | Manufacturer deletes own product | `MANUFACTURER` owner | `200` |
| Products | DELETE | `/api/products/:id` | Manufacturer deletes other product | `MANUFACTURER` non-owner | Request denied or no matching product deleted |
| Users | GET | `/api/users/profile` | User reads own profile | Any authenticated role | `200` |
| Users | PUT | `/api/users/profile` | User updates own profile | Any authenticated role | `200` |

## Edge Test Cases

| Module | Method | Endpoint | Test Case | Request / Setup | Expected Result |
|---|---:|---|---|---|---|
| Auth | POST | `/api/auth/signup` | Email with uppercase and spaces | `email: " Test@Email.com "` | Email normalized; signup succeeds |
| Auth | POST | `/api/auth/login` | Login email with uppercase and spaces | `email: " Test@Email.com "` | Login succeeds if credentials match |
| Auth | POST | `/api/auth/signup` | Lowercase role | `role: "customer"` | Role normalized to `CUSTOMER` |
| Auth | POST | `/api/auth/signup` | Profile table insert fails | Role profile table constraint failure | Auth user and app user cleaned up |
| Auth | POST | `/api/auth/logout` | Token already revoked | Revoked token | `401`, invalid or expired token |
| Users | GET | `/api/users/profile` | Valid JWT but missing app profile | Supabase Auth user exists, `users` row missing | `401`, user profile not found |
| Products | GET | `/api/products` | Empty product list | No products exist | `200`, empty array |
| Products | GET | `/api/products` | Large product list | Many products exist | `200`; consider pagination later |
| Products | POST | `/api/products` | Duplicate SKU | Existing SKU if unique constraint exists | `400`, unique constraint error |
| Products | POST | `/api/products` | Manufacturer role without manufacturer row | User has `MANUFACTURER` role but no profile row | `404`, manufacturer profile not found |
| Products | PUT | `/api/products/:id` | Product deleted before update | Valid old product ID | Not-found-style response |
| Products | DELETE | `/api/products/:id` | Delete same product twice | Send delete twice | First succeeds, second returns not-found-style response |
| Products | PUT | `/api/products/:id` | Attempt product ownership transfer | Body includes `manufacturer_id` | Owner remains unchanged |

## Recommended Test Data

| Data Type | Example |
|---|---|
| Customer Email | `customer.test@example.com` |
| Manufacturer Email | `manufacturer.test@example.com` |
| Retailer Email | `retailer.test@example.com` |
| Password | `TestPassword123!` |
| Product Name | `Gold Ring` |
| SKU | `SKU-GOLD-RING-001` |
| Material | `Gold` |
| Purity | `22K` |
| Price | `25000` |
| Stock Quantity | `10` |

## Notes

| Topic | Recommendation |
|---|---|
| Database Constraints | Add DB constraints for non-negative `price` and `stock_quantity` if not already present |
| Pagination | Add pagination to `GET /api/products` before production scale |
| Validation | Add request validation middleware for stricter and clearer API errors |
| RLS | Keep Row Level Security enabled in Supabase and use server-side admin client only where required |
| Test Automation | Convert these cases into Jest/Supertest or Postman/Newman tests |
