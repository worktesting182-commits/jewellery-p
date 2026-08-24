# Jest + Supertest Test Report

## Overview

| Item | Details |
|---|---|
| Backend Stack | Node.js, Express.js, Supabase, ES Modules |
| Test Framework | Jest |
| HTTP Test Library | Supertest |
| Supabase Strategy | Mocked Supabase clients |
| Test Location | `backend/__tests__` |
| App Entry for Tests | `backend/app.js` |
| Server Entry | `backend/server.js` |

## Files Created

| File | Purpose |
|---|---|
| `backend/app.js` | Exports the Express app without starting the server, so Supertest can import it safely |
| `backend/server.js` | Starts the Express server using the exported app |
| `backend/jest.config.js` | Jest configuration for Node.js and test file discovery |
| `backend/__tests__/helpers/supabaseMock.js` | Reusable Supabase mock helper for auth and chainable database queries |
| `backend/__tests__/auth.test.js` | Authentication endpoint tests |
| `backend/__tests__/users.test.js` | User API endpoint tests |
| `backend/__tests__/products.test.js` | Product endpoint tests |
| `backend/__tests__/categories.test.js` | Category endpoint tests |

## Package Updates

| File | Change |
|---|---|
| `backend/package.json` | Added `test` script |
| `backend/package.json` | Added `test:watch` script |
| `backend/package.json` | Added `jest` dev dependency |
| `backend/package.json` | Added `supertest` dev dependency |

## Test Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm test` | `node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand` | Run all tests once |
| `npm run test:watch` | `node --experimental-vm-modules node_modules/jest/bin/jest.js --watch` | Run tests in watch mode |

## Test Lifecycle Hooks

| Hook | Usage |
|---|---|
| `beforeAll` | Dynamically imports the Express app after Supabase module mocking is configured |
| `beforeEach` | Resets Supabase mock state before each test |
| `afterAll` | Restores Jest mocks after each suite |

## Supabase Mocking

| Mock Area | Coverage |
|---|---|
| `supabase.auth.getUser` | Auth middleware token verification |
| `supabase.auth.signInWithPassword` | Login flow |
| `supabaseAdmin.auth.admin.createUser` | Signup Auth user creation |
| `supabaseAdmin.auth.admin.deleteUser` | Signup rollback cleanup |
| `supabaseAdmin.auth.admin.signOut` | Logout token revocation |
| `supabaseAdmin.from(...).select()` | Read queries |
| `supabaseAdmin.from(...).insert()` | Create queries |
| `supabaseAdmin.from(...).update()` | Update queries |
| `supabaseAdmin.from(...).delete()` | Delete queries |
| Chain Methods | `eq`, `single`, `maybeSingle`, `order`, `limit`, promise-style awaits |

## Authentication Test Coverage

| Endpoint | Scenario | Expected |
|---|---|---|
| `POST /api/auth/signup` | Creates customer user and customer profile | `201` |
| `POST /api/auth/signup` | Rejects invalid role | `400` |
| `POST /api/auth/signup` | Deletes Auth user when app user insert fails | `400` and rollback called |
| `POST /api/auth/login` | Returns tokens and app user profile | `200` |
| `POST /api/auth/login` | Rejects missing credentials | `400` |
| `POST /api/auth/logout` | Revokes current access token | `200` |
| `POST /api/auth/logout` | Rejects missing Authorization header | `401` |

## User API Test Coverage

| Endpoint | Scenario | Expected |
|---|---|---|
| `GET /api/users/profile` | Returns authenticated user's profile | `200` |
| `PUT /api/users/profile` | Updates authenticated user's editable fields | `200` |
| `GET /api/users/profile` | Rejects missing token | `401` |
| `GET /api/users` | Returns users for admin role | `200` |
| `GET /api/users` | Denies non-admin users | `403` |
| `GET /api/users/:id` | Returns one user for admin role | `200` |

## Product Test Coverage

| Endpoint | Scenario | Expected |
|---|---|---|
| `GET /api/products` | Returns public product list | `200` |
| `GET /api/products/:id` | Returns product by ID | `200` |
| `POST /api/products` | Creates product for manufacturer | `201` |
| `POST /api/products` | Denies customer role | `403` |
| `PUT /api/products/:id` | Updates only owned product with allowed fields | `200` |
| `PUT /api/products/:id` | Rejects empty update body | `400` |
| `DELETE /api/products/:id` | Deletes only owned product | `200` |

## Category Test Coverage

| Endpoint | Scenario | Expected |
|---|---|---|
| `GET /api/categories` | Returns public categories | `200` |
| `GET /api/categories/:id` | Returns category by ID | `200` |
| `POST /api/categories` | Creates category for admin | `201` |
| `POST /api/categories` | Denies non-admin user | `403` |
| `PUT /api/categories/:id` | Updates category for admin | `200` |
| `DELETE /api/categories/:id` | Deletes category for admin | `200` |
| `POST /api/categories` | Rejects missing token | `401` |

## Validation Performed

| Check | Result |
|---|---|
| `node --check backend/app.js` | Passed |
| `node --check backend/server.js` | Passed |
| `node --check backend/__tests__/helpers/supabaseMock.js` | Passed |
| `node --check backend/__tests__/auth.test.js` | Passed |
| `node --check backend/__tests__/users.test.js` | Passed |
| `node --check backend/__tests__/products.test.js` | Passed |
| `node --check backend/__tests__/categories.test.js` | Passed |

## Test Run Status

| Command | Result |
|---|---|
| `npm test` | Could not run through PowerShell because `npm.ps1` execution is disabled |
| `npm.cmd test` | Started correctly, but failed because Jest is not installed in `backend/node_modules` |
| `npm.cmd install` | Not run because install approval was declined |

## How To Run

| Step | Command |
|---|---|
| 1 | `cd backend` |
| 2 | `npm install` |
| 3 | `npm test` |

## Notes

| Topic | Note |
|---|---|
| ES Modules | Jest uses `--experimental-vm-modules` to support ES module tests |
| Supertest | Tests import `backend/app.js`, so the server does not bind to a real port |
| Supabase | Supabase is mocked, so tests do not require live Supabase credentials |
| Isolation | Each test resets Supabase mock state in `beforeEach` |
| Authorization | Role-based access is tested for admin, customer, and manufacturer flows |
