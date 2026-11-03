# Product Requirements Document (PRD)

## Project Codename: KasirKu
**Target Stack:**
- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend:** Golang (`net/http` or `chi` router)
- **Database:** PostgreSQL
- **Architecture:** Monorepo (`/frontend`, `/backend`, `/database`)

---

### 1. Product Overview

#### 1.1 Problem Statement
Small retail businesses (convenience stores, small grocers, retail boutiques) frequently rely on manual paper ledgers, fragmented desktop spreadsheets, or generic consumer payment apps to manage daily sales. This creates three critical points of operational failure:
1. **Inventory Shrinkage & Stock-Outs:** Discrepancies between physical inventory and paper records go undetected until month-end audits, causing unfulfilled customer demand or undetected theft.
2. **Lack of Role Separation & Financial Vulnerability:** Without role-based access control, cashiers either operate on shared accounts or have unrestricted visibility into wholesale profit margins, product cost structures, and administrative settings. Store owners cannot audit individual register shifts or attribute register shortages to specific personnel.
3. **Checkout Inefficiencies:** Manual tallying and calculation slow down checkout lines, introduce arithmetic errors during cash change calculation, and erode customer trust.

**KasirKu** solves these challenges by providing a responsive, role-delineated web-based Point of Sale (POS) system that enforces strict transactional boundaries between administrative management and register operations.

#### 1.2 Target Users

| Role | Profile & Primary Goals | Core Pain Points |
| :--- | :--- | :--- |
| **Admin**<br>*(Store Owner / Store Manager)* | - Maintain catalog accuracy (pricing, inventory, SKUs).<br>- Audit store sales, revenue, and historical transactions.<br>- Provision and manage Staff credentials.<br>- Safeguard financial metrics and business configuration. | - Cash discrepancies at the end of shifts.<br>- Inability to trace transactions to specific employees.<br>- Risk of staff tampering with product prices or inventory counts.<br>- Time-consuming manual sales consolidation. |
| **Staff**<br>*(Cashier / Shift Worker)* | - Swiftly search items by name or SKU.<br>- Ring up customer orders without latency.<br>- Accurately calculate cash change or register card tenders.<br>- Issue itemized receipts.<br>- Review transactions processed during their active shift. | - Cluttered interfaces featuring managerial functions they do not need.<br>- Slow checkout systems that create customer queues.<br>- Manual math errors during cash-back calculations.<br>- Fear of accidental catalog alteration or configuration breakage. |

---

### 2. Goals & Non-Goals (Scope Boundaries)

#### 2.1 Goals (v1 MVP Scope)
- **Secure Authentication & RBAC Enforcement:** Role-based access control separating Admin and Staff across frontend routes (Next.js middleware) and backend REST API endpoints (Go middleware).
- **Product & Inventory Management:** Comprehensive CRUD capabilities for Admins, SKU uniqueness validation, real-time stock tracking, and active/inactive status flagging.
- **High-Velocity Checkout Register:** Optimized cashier interface with fast product lookup (name and SKU search), responsive cart manipulation, automated change calculation, and printable receipt generation.
- **Strict Data & Monetary Integrity:** Atomic database transactions for checkout execution to eliminate overselling/race conditions, and mandatory integer-based monetary storage (smallest currency units) to eradicate floating-point rounding errors.
- **Shift & Store Auditing:** Real-time visibility into sales history: Admins inspect store-wide aggregations; Staff inspect only their own shift transactions.

#### 2.2 Non-Goals (Explicitly Out of Scope for v1)
- **Multi-Branch / Multi-Store Tenancy:** The MVP assumes a single physical store location with one centralized inventory pool.
- **Offline-First Synchronization:** The application operates as an online web client; offline IndexedDB sync and conflict resolution are excluded.
- **Third-Party Payment Gateway Integration:** No direct SDK or webhook integrations with payment processors (e.g., Stripe, Midtrans, Square). Payments are recorded as tender types (Cash, Card, Digital/QRIS) for auditing and receipting.
- **Hardware Driver Daemon Integration:** No native ESC/POS thermal printer raw socket daemons or serial scale drivers. Receipts leverage standard browser print stylesheets (`@media print`) and barcode input uses standard USB/Bluetooth keyboard-wedge emulation.
- **Promotions, Discounts & Loyalty Engine:** Complex coupon rules, tiered volume discounts, and customer loyalty point accumulators are deferred to future iterations.
- **Supplier & Purchase Order (PO) Management:** Procurement workflows, vendor catalogs, and accounts payable are out of scope.

---

### 3. User Stories & Role Permissions (RBAC)

#### 3.1 User Stories

##### Admin User Stories
- **US-A1 (Authentication):** As an Admin, I want to securely authenticate with my credentials so that I can access administrative controls and sensitive sales reports.
- **US-A2 (Product CRUD):** As an Admin, I want to create, edit, deactivate, and view products with unique SKUs, selling prices, and initial stock quantities so that the store catalog remains accurate.
- **US-A3 (Inventory Adjustment):** As an Admin, I want to adjust stock counts manually (for restocks or shrinkage) so that physical shelf inventory matches database inventory.
- **US-A4 (Sales Auditing):** As an Admin, I want to review all transactions filtered by date range and cashier so that I can audit revenue and verify daily registers.
- **US-A5 (User Provisioning):** As an Admin, I want to create Staff accounts and deactivate former employees so that only authorized personnel can operate registers.

##### Staff (Cashier) User Stories
- **US-S1 (Shift Login):** As a Staff member, I want to log in using my assigned credentials so that all sales I process are properly attributed to my shift.
- **US-S2 (Product Search & Register):** As a Staff member, I want to quickly search products by name or scan their SKU so that items are added to the active cart without delay.
- **US-S3 (Checkout & Payment):** As a Staff member, I want to input the cash amount tendered by a customer and view the exact change due (or record card payment) so that I can complete the checkout accurately.
- **US-S4 (Receipt Issuance):** As a Staff member, I want to print or view a clean receipt immediately after payment confirmation so that I can hand it to the customer.
- **US-S5 (Stock Inquiry):** As a Staff member, I want to check current stock availability for an item in real time without having permissions to modify the price or quantity.
- **US-S6 (Shift History):** As a Staff member, I want to view a list of transactions completed by my own account during the current shift to reconcile my register drawer.

#### 3.2 Role-Based Access Control (RBAC) Matrix

| Resource / Action | Method | Endpoint / Route | Admin | Staff | Technical Enforcement |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **User Login** | `POST` | `/api/auth/login` | Allowed | Allowed | Public endpoint |
| **Verify Session** | `GET` | `/api/auth/me` | Allowed | Allowed | Authenticated JWT |
| **Manage Users (CRUD)** | `ALL` | `/api/users/*` | Allowed | **Denied (403)** | Go `RequireRole("admin")` + Next.js Route Guard |
| **Read Products (POS/Search)** | `GET` | `/api/products` | Allowed | Allowed | Authenticated JWT |
| **Read Product Details** | `GET` | `/api/products/{id}` | Allowed | Allowed | Authenticated JWT |
| **Create Product** | `POST` | `/api/products` | Allowed | **Denied (403)** | Go `RequireRole("admin")` + Next.js Route Guard |
| **Update Product / Stock** | `PUT` | `/api/products/{id}` | Allowed | **Denied (403)** | Go `RequireRole("admin")` + Next.js Route Guard |
| **Deactivate/Delete Product** | `DELETE`| `/api/products/{id}` | Allowed | **Denied (403)** | Go `RequireRole("admin")` + Next.js Route Guard |
| **Execute Checkout** | `POST` | `/api/transactions` | Allowed | Allowed | Authenticated JWT (`user_id` bound to token) |
| **View Own Transactions** | `GET` | `/api/transactions` | Allowed | Allowed* | Staff query auto-scoped to `user_id == current_user.id` |
| **View All Transactions** | `GET` | `/api/transactions?all=true` | Allowed | **Denied (403)** | Go `RequireRole("admin")` |
| **View Transaction Details** | `GET` | `/api/transactions/{id}` | Allowed | Allowed* | Staff restricted to own transactions |
| **View Sales Reports** | `GET` | `/api/reports/sales` | Allowed | **Denied (403)** | Go `RequireRole("admin")` + Next.js Route Guard |
| **Access Admin UI** | `PAGE` | `/admin/*` | Allowed | **Denied (Redirect)**| Next.js Edge Middleware |
| **Access POS Register UI** | `PAGE` | `/pos` | Allowed | Allowed | Next.js Edge Middleware |

#### 3.3 Key Security Constraints & Invariants
1. **Server-Side Price Authority:** Client applications NEVER submit unit prices during checkout. The backend calculates line totals and grand totals exclusively using price records retrieved directly from the database inside an active transaction.
2. **Strict Route Segregation:** Staff tokens accessing Admin UI routes (`/admin/*`) are redirected via Next.js Middleware to `/pos`.
3. **No Role Elevation:** Staff users cannot modify their own role, change other users' passwords, or access administrative endpoints via API tools (e.g., Postman/curl); violations return `403 Forbidden`.

---

### 4. Functional Requirements (Feature Modules)

#### 4.1 Authentication & Authorization Module
- **Credential Validation:** Email and password authentication using standard JSON payloads.
- **Password Security:** Store passwords using `bcrypt` (minimum cost factor 12).
- **Stateless Session Management:** Issue signed JSON Web Tokens (JWT) containing standard claims (`sub` = user ID, `role` = user role, `email`, `exp` = token expiration).
- **Middleware Protections:**
  - **Next.js Edge Middleware:** Inspects incoming session cookies/tokens before rendering routes. Unauthorized requests to `/admin/*` redirect to `/pos` or `/login`.
  - **Go HTTP Middleware:**
    - `AuthMiddleware`: Validates JWT signature, checks expiration, and extracts claims into the request context (`r.Context()`).
    - `RequireRole(role)`: Validates that the context role matches the required permission, terminating unauthorized requests with HTTP `403 Forbidden`.

#### 4.2 Product & Inventory Management Module
- **Catalog Attributes:**
  - `name`: Product title (string, 1-255 characters).
  - `sku`: Stock Keeping Unit (alphanumeric string, unique index, barcode-compatible).
  - `price`: Retail price stored as an integer representing the smallest currency unit (e.g., IDR 15,000 or USD 15.00 stored as 1500 cents).
  - `stock`: Current units on hand (integer, non-negative).
  - `is_active`: Soft-deletion/active status boolean. Inactive products cannot be added to new carts but preserve historical receipt fidelity.
- **Stock Tracking & Deduction:**
  - Successful checkout automatically decrements product stock.
  - Stock validation prevents inventory from dropping below zero.
  - Manual inventory adjustments can only be performed by Admins with validation checks.

#### 4.3 Point of Sale (Checkout) Module
- **Fast Search & Barcode Emulation:**
  - Debounced text search filtering by product name or exact SKU match.
  - Keyboard listener on the search input to handle hardware barcode scanners (captures input stream and automatically triggers cart addition on Enter key).
- **Cart Management:**
  - Add item, increment/decrement quantity, and remove item.
  - Real-time client-side calculation of line item totals and grand total for visual feedback.
  - Out-of-stock validation prevents adding items when `cart_quantity >= product_stock`.
- **Tender & Payment Processing:**
  - Payment method selection: `cash`, `card`, `qris`.
  - Cash mode: Cashier inputs `cash_received`. Client and server validate `cash_received >= total_amount` and compute `change_due = cash_received - total_amount`.
  - Non-cash mode: Full amount charged to selected method (`change_due = 0`).
- **Atomic Checkout Execution:**
  - Checkout request dispatched to `POST /api/transactions`.
  - Executed within a single PostgreSQL database transaction using row-level locking (`SELECT ... FOR UPDATE` or conditional atomic decrements) to prevent race conditions during concurrent checkouts.
- **Receipt Generation:**
  - Immediate visual confirmation upon 201 Created response.
  - Printable receipt layout formatted for standard POS roll sizes (58mm and 80mm widths) via CSS print media styles.
  - Receipt metadata: Store Name, Invoice Number, Timestamp, Cashier Name, Line Items (Name, Qty, Unit Price, Subtotal), Grand Total, Payment Method, Cash Received, and Change Given.

#### 4.4 Sales History & Reporting Module
- **Transaction Log:**
  - Immutable historical record of every completed sale.
  - Admins can filter by date ranges (`start_date`, `end_date`), cashier ID, and invoice number.
  - Staff can view only transactions initiated by their own authenticated user ID for the current date/shift.
- **Sales Analytics (Admin Only):**
  - Summary KPI cards: Gross Revenue, Total Transaction Count, Average Order Value (AOV).
  - Top 5 best-selling products by volume and revenue.

---

### 5. Data Model & Database Schema (PostgreSQL)

#### 5.1 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ transactions : "processes"
    transactions ||--|{ transaction_items : "contains"
    products ||--o{ transaction_items : "referenced_in"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    products {
        uuid id PK
        varchar sku UK
        varchar name
        bigint price
        integer stock
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    transactions {
        uuid id PK
        varchar invoice_number UK
        uuid user_id FK
        bigint total_amount
        varchar payment_method
        bigint cash_received
        bigint change_given
        timestamptz created_at
    }

    transaction_items {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        integer quantity
        bigint price_at_sale
        bigint subtotal
    }
```

#### 5.2 Database DDL Specifications

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    price BIGINT NOT NULL CHECK (price >= 0), -- Stored in smallest monetary unit (cents/integer)
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'qris')),
    cash_received BIGINT NULL CHECK (cash_received IS NULL OR cash_received >= 0),
    change_given BIGINT NULL CHECK (change_given IS NULL OR change_given >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: transaction_items
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale BIGINT NOT NULL CHECK (price_at_sale >= 0),
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0)
);

-- Indexes for Query Performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transaction_items_tx_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);
```

#### 5.3 Currency Representation Standard
- **Zero Floating-Point Policy:** Columns `price`, `total_amount`, `price_at_sale`, `subtotal`, `cash_received`, and `change_given` utilize `BIGINT`.
- **Monetary Unit:** Stored as the smallest discrete unit (e.g., US Cents: `$19.99` $\rightarrow$ `1999`; Indonesian Rupiah: `Rp 50.000` $\rightarrow$ `50000`).
- **Formatting:** Currency formatting is performed purely at the presentation layer (UI) or receipt formatter.

---

### 6. API Design (Golang Backend)

#### 6.1 Endpoint Registry

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns JWT token & user profile. |
| `GET` | `/api/auth/me` | Staff & Admin | Returns active authenticated user session data. |
| `GET` | `/api/products` | Staff & Admin | Lists active products (supports `?search=`, `?page=`, `?limit=`). |
| `GET` | `/api/products/{id}` | Staff & Admin | Retrieves single product details. |
| `POST` | `/api/products` | **Admin Only** | Creates a new product with unique SKU and initial stock. |
| `PUT` | `/api/products/{id}` | **Admin Only** | Updates product details, pricing, and stock. |
| `DELETE`| `/api/products/{id}` | **Admin Only** | Soft-deletes product (`is_active = false`). |
| `POST` | `/api/transactions` | Staff & Admin | Processes cart checkout atomically and deducts stock. |
| `GET` | `/api/transactions` | Staff & Admin | Lists transactions (Admin views all; Staff filtered to self). |
| `GET` | `/api/transactions/{id}` | Staff & Admin | Retrieves full transaction details with itemized list. |
| `GET` | `/api/reports/sales` | **Admin Only** | Aggregated revenue, transaction count, and date-range totals. |
| `GET` | `/api/users` | **Admin Only** | Lists all user accounts with roles and statuses. |
| `POST` | `/api/users` | **Admin Only** | Provisions a new Staff or Admin user account. |
| `PUT` | `/api/users/{id}` | **Admin Only** | Updates user profile, role, or active status. |

---

#### 6.2 Critical Endpoint Specification: `POST /api/transactions`

##### Request
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **Payload Schema:**
```json
{
  "payment_method": "cash",
  "cash_received": 50000,
  "items": [
    {
      "product_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "quantity": 2
    },
    {
      "product_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "quantity": 1
    }
  ]
}
```
*Note: Client provides only `product_id` and `quantity`. Price is never supplied by the client.*

##### Backend Processing Steps (Atomic DB Transaction)
1. Begin PostgreSQL transaction: `tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})`.
2. Generate unique `invoice_number` (format: `INV-YYYYMMDD-XXXXX`).
3. For each item in payload:
   - Query product record with row lock: `SELECT id, name, price, stock, is_active FROM products WHERE id = $1 FOR UPDATE`.
   - Validate `is_active == true`.
   - Validate `stock >= item.quantity`. If insufficient, rollback transaction and return `409 Conflict`.
   - Compute line subtotal: `subtotal = price * item.quantity`.
   - Decrement stock: `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`.
   - Accumulate `total_amount += subtotal`.
4. Validate payment:
   - If `payment_method == "cash"`:
     - Verify `cash_received >= total_amount`. If invalid, rollback and return `400 Bad Request`.
     - Calculate `change_given = cash_received - total_amount`.
   - If `payment_method IN ("card", "qris")`:
     - `cash_received = total_amount`
     - `change_given = 0`
5. Insert transaction record into `transactions`:
   - Store `user_id` extracted from JWT claims.
6. Bulk insert line items into `transaction_items` capturing `price_at_sale` and `subtotal`.
7. Commit database transaction.

##### Response (201 Created)
```json
{
  "status": "success",
  "data": {
    "id": "e3b0c442-98fc-1c14-9afb-4c76063515d4",
    "invoice_number": "INV-20261103-00042",
    "cashier": {
      "id": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      "name": "Jane Cashier"
    },
    "total_amount": 45000,
    "payment_method": "cash",
    "cash_received": 50000,
    "change_given": 5000,
    "created_at": "2026-11-03T12:00:00Z",
    "items": [
      {
        "product_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "product_name": "Arabica Coffee Beans 250g",
        "sku": "COF-ARA-250",
        "quantity": 2,
        "price_at_sale": 15000,
        "subtotal": 30000
      },
      {
        "product_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "product_name": "Paper Cups 8oz (50pcs)",
        "sku": "CUP-08-050",
        "quantity": 1,
        "price_at_sale": 15000,
        "subtotal": 15000
      }
    ]
  }
}
```

##### Error Responses
- **400 Bad Request:**
  ```json
  {
    "status": "error",
    "code": "INSUFFICIENT_TENDER",
    "message": "Cash received (40000) is less than total amount (45000)"
  }
  ```
- **409 Conflict:**
  ```json
  {
    "status": "error",
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product 'Arabica Coffee Beans 250g'. Requested: 2, Available: 1"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "status": "error",
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired authorization token"
  }
  ```

---

### 7. Non-Functional Requirements & Technical Constraints

#### 7.1 Security & Authentication
- **Password Hashing:** Passwords must be hashed using `bcrypt` with cost $\ge 12$. Plaintext passwords must never be logged or stored.
- **JWT Architecture:** Stateless tokens signed with HMAC-SHA256 (`HS256`). Tokens have an 8-hour lifespan matching a standard retail shift.
- **CORS Configuration:** Backend strictly enforces CORS origins:
  - Allowed Origin: `http://localhost:3000` (development) or configured production domain.
  - Allowed Headers: `Content-Type`, `Authorization`.
  - Allowed Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
- **SQL Injection Prevention:** 100% of database queries must use prepared statements or parameterized queries (`$1`, `$2`) through `database/sql` / `pgx`. Object-relational string concatenations are prohibited.

#### 7.2 Performance & Reliability
- **Checkout Latency:** `POST /api/transactions` must respond with $P95 < 200\text{ ms}$ under normal store operational load ($\le 10$ concurrent requests).
- **Catalog Search Latency:** `GET /api/products?search={query}` must respond in $< 50\text{ ms}$ backed by B-tree indices on `sku` and `name`.
- **Database Connection Pool:**
  - Maximum open connections: 25.
  - Maximum idle connections: 10.
  - Connection max lifetime: 5 minutes.

#### 7.3 Repository & Monorepo Structure

```text
/KasirKu
├── /frontend                  # Next.js (App Router)
│   ├── /src
│   │   ├── /app
│   │   │   ├── /login         # Public login page
│   │   │   ├── /pos           # Staff & Admin POS register interface
│   │   │   ├── /admin         # Admin-only dashboard, products, reports, users
│   │   │   │   ├── /products
│   │   │   │   ├── /reports
│   │   │   │   └── /users
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx       # Root redirector based on auth role
│   │   ├── /components        # UI components (Cart, Receipt, Table, Modals)
│   │   ├── /lib               # API client, formatting utils, auth helpers
│   │   └── middleware.ts      # Next.js Edge route guard middleware
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── /backend                   # Golang REST API
│   ├── /cmd
│   │   └── /api
│   │       └── main.go        # Server entrypoint and router registration
│   ├── /internal
│   │   ├── /config            # Environment variable parsing
│   │   ├── /handler           # HTTP transport controllers (JSON parsing/validation)
│   │   ├── /middleware        # AuthMiddleware, RequireRole, CORS, Logger
│   │   ├── /model             # Core structs and domain entities
│   │   ├── /repository        # SQL queries and DB transaction execution
│   │   └── /service           # Business logic (checkout calculation, stock validation)
│   ├── go.mod
│   └── go.sum
│
├── /database
│   ├── /migrations            # Raw SQL migration files (up/down)
│   └── /seeds                 # Seed data (default admin user, sample products)
│
├── docker-compose.yml         # Local PostgreSQL service container
└── README.md
```

#### 7.4 Environment Configuration
- **Backend (`backend/.env`):**
  - `PORT=8080`
  - `DATABASE_URL=postgres://kasirku:kasirku_password@localhost:5432/kasirku_db?sslmode=disable`
  - `JWT_SECRET=super-secret-random-32-byte-minimum-key`
  - `JWT_EXPIRATION_HOURS=8`
  - `CORS_ALLOWED_ORIGINS=http://localhost:3000`
- **Frontend (`frontend/.env.local`):**
  - `NEXT_PUBLIC_API_URL=http://localhost:8080/api`

---

### 8. Acceptance Criteria (Definition of Done)

1. **Role-Based Access Enforcement (Zero-Trust Security):**
   - An authenticated user with `role: "staff"` attempting to execute `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `GET /api/reports/sales`, or `GET /api/users` receives an immediate HTTP `403 Forbidden` response.
   - An authenticated Staff user attempting to access any browser URL matching `/admin/*` is intercepted by Next.js middleware and redirected to `/pos`.

2. **Atomic Inventory Checkout & Race Condition Prevention:**
   - When a transaction containing item $P$ with current stock $S$ is submitted:
     - If requested quantity $Q \le S$, the sale succeeds, returns `201 Created`, creates an immutable `transaction` record, inserts line items with locked `price_at_sale`, and reduces product stock to $S - Q$.
     - If requested quantity $Q > S$, the transaction is aborted via database rollback, stock remains $S$, no transaction record is created, and the API returns `409 Conflict`.

3. **Tamper-Proof Price Calculation:**
   - The checkout endpoint `POST /api/transactions` accepts only `product_id` and `quantity`. It rejects any client-supplied unit prices or recalculates totals strictly from database product prices. The line totals and `total_amount` must match the sum of database unit prices multiplied by quantities.

4. **Cash Calculation & Change Validation:**
   - For cash transactions, the API rejects any submission where `cash_received < total_amount` with `400 Bad Request`.
   - If `cash_received >= total_amount`, the API calculates `change_given = cash_received - total_amount` and persists this exact figure in the database.

5. **Shift Isolation for Staff:**
   - A Staff user requesting `GET /api/transactions` receives only transactions where `user_id` matches their own token ID. Only Admins can view store-wide transactions and revenue aggregations.
