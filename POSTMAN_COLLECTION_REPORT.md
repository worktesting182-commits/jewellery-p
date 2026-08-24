# Postman Collection Report

## Collection Overview

| Item | Details |
|---|---|
| Collection Name | Jewellery Express Supabase API |
| Postman Schema | Collection v2.1 |
| Base URL | `http://localhost:5000` |
| Base URL Variable | `{{base_url}}` |
| Auth Token Variable | `{{access_token}}` |
| Product ID Variable | `{{product_id}}` |
| Category ID Variable | `{{category_id}}` |
| User ID Variable | `{{user_id}}` |

## Collection Variables

| Variable | Default Value | Purpose |
|---|---|---|
| `base_url` | `http://localhost:5000` | Backend server URL |
| `access_token` | Empty | JWT access token from login |
| `product_id` | Empty | Product ID for get/update/delete product requests |
| `category_id` | Empty | Category ID for category and product requests |
| `user_id` | Empty | User ID for admin user lookup |

## Folder Structure

| Folder | Included Requests |
|---|---|
| Health | Home, Test Supabase Connection |
| Auth | Signup Customer, Signup Manufacturer, Signup Retailer, Login, Logout |
| Users | Get Profile, Update Profile, Get All Users Admin, Get User By ID Admin |
| Products | Get Products, Get Product By ID, Create Product, Update Product, Delete Product |
| Categories | Get Categories, Get Category By ID, Create Category, Update Category, Delete Category |

## Health Endpoints

| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| GET | `/` | No | Check if API server is running |
| GET | `/test-supabase` | No | Check Supabase database connection |

## Auth Endpoints

| Method | Endpoint | Auth Required | Example Body | Expected Use |
|---|---|---|---|---|
| POST | `/api/auth/signup` | No | Customer signup body | Create a customer account |
| POST | `/api/auth/signup` | No | Manufacturer signup body | Create a manufacturer account |
| POST | `/api/auth/signup` | No | Retailer signup body | Create a retailer account |
| POST | `/api/auth/login` | No | Email and password | Login and save `access_token` into collection variables |
| POST | `/api/auth/logout` | Yes | None | Revoke current authenticated session |

## User Endpoints

| Method | Endpoint | Auth Required | Role Required | Purpose |
|---|---|---|---|---|
| GET | `/api/users/profile` | Yes | Any authenticated user | Get logged-in user's profile |
| PUT | `/api/users/profile` | Yes | Any authenticated user | Update logged-in user's profile |
| GET | `/api/users` | Yes | `ADMIN` | Get all users |
| GET | `/api/users/{{user_id}}` | Yes | `ADMIN` | Get one user by ID |

## Product Endpoints

| Method | Endpoint | Auth Required | Role Required | Purpose |
|---|---|---|---|---|
| GET | `/api/products` | No | Public | List products |
| GET | `/api/products/{{product_id}}` | No | Public | Get product by ID |
| POST | `/api/products` | Yes | `MANUFACTURER` | Create product |
| PUT | `/api/products/{{product_id}}` | Yes | `MANUFACTURER` owner | Update own product |
| DELETE | `/api/products/{{product_id}}` | Yes | `MANUFACTURER` owner | Delete own product |

## Category Endpoints

| Method | Endpoint | Auth Required | Role Required | Purpose |
|---|---|---|---|---|
| GET | `/api/categories` | No | Public | List categories |
| GET | `/api/categories/{{category_id}}` | No | Public | Get category by ID |
| POST | `/api/categories` | Yes | `ADMIN` | Create category |
| PUT | `/api/categories/{{category_id}}` | Yes | `ADMIN` | Update category |
| DELETE | `/api/categories/{{category_id}}` | Yes | `ADMIN` | Delete category |

## Example Request Bodies

| Request | Body |
|---|---|
| Signup Customer | `{ "full_name": "Customer Test", "email": "customer.test@example.com", "password": "TestPassword123!", "phone": "9876543210", "role": "CUSTOMER" }` |
| Signup Manufacturer | `{ "full_name": "Manufacturer Test", "email": "manufacturer.test@example.com", "password": "TestPassword123!", "phone": "9876543211", "role": "MANUFACTURER" }` |
| Signup Retailer | `{ "full_name": "Retailer Test", "email": "retailer.test@example.com", "password": "TestPassword123!", "phone": "9876543212", "role": "RETAILER" }` |
| Login | `{ "email": "manufacturer.test@example.com", "password": "TestPassword123!" }` |
| Update Profile | `{ "full_name": "Updated User Name", "phone": "9999999999", "profile_image": "https://example.com/profile.jpg" }` |
| Create Product | `{ "category_id": "{{category_id}}", "name": "Gold Ring", "description": "22K gold ring with classic design", "sku": "SKU-GOLD-RING-001", "material": "Gold", "purity": "22K", "weight": 8.5, "price": 25000, "stock_quantity": 10, "is_recyclable": true, "status": "ACTIVE" }` |
| Update Product | `{ "name": "Updated Gold Ring", "price": 27000, "stock_quantity": 15, "status": "ACTIVE" }` |
| Create Category | `{ "name": "Rings", "description": "Jewellery ring category" }` |
| Update Category | `{ "name": "Updated Rings", "description": "Updated jewellery ring category" }` |

## Authorization Header

| Header | Value | Used By |
|---|---|---|
| `Authorization` | `Bearer {{access_token}}` | Logout, user profile APIs, admin user APIs, product mutations, category mutations |
| `Content-Type` | `application/json` | POST and PUT requests with JSON bodies |

## Recommended Testing Flow

| Step | Action |
|---|---|
| 1 | Run `GET /` to confirm the backend is running |
| 2 | Run `GET /test-supabase` to confirm database connectivity |
| 3 | Run `POST /api/auth/signup` for a manufacturer |
| 4 | Run `POST /api/auth/login` using the manufacturer account |
| 5 | Confirm `{{access_token}}` is saved after login |
| 6 | Create or set a valid `{{category_id}}` |
| 7 | Run `POST /api/products` to create a product |
| 8 | Confirm `{{product_id}}` is saved after product creation |
| 9 | Run get, update, and delete product requests |
| 10 | Run `POST /api/auth/logout` after protected testing |

## Notes

| Topic | Note |
|---|---|
| Login Token Script | The login request stores `access_token` automatically if the response contains `access_token` |
| Product ID Script | The create product request stores `product_id` automatically if the response contains product data |
| Category ID Script | The create category request stores `category_id` automatically if the response contains category data |
| Admin APIs | Admin user and category mutation requests require an account with `ADMIN` role |
| Manufacturer APIs | Product create/update/delete requests require a `MANUFACTURER` role and matching manufacturer profile |
