# POSv1 - Modern Point of Sale (POS) & Inventory System

A modern, responsive, multi-role web-based Point of Sale (POS) and inventory management system built as a unified monorepo (**Next.js 16 + Golang + PostgreSQL 16**). Engineered with **Mobile-First UX Discipline (Baseline: 360px Viewport)** for cashier tablets and smartphones, strict Role-Based Access Control (**RBAC Admin & Staff**), atomic transaction processing at the PostgreSQL database level, and production readiness for **Vercel** with **Neon Serverless PostgreSQL Connection Pooling**.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4, Lucide Icons)
- **Backend:** Golang (`go-chi/chi/v5`, `database/sql`, `lib/pq`, `golang-jwt/jwt/v5`, `bcrypt`)
- **Database:** PostgreSQL 16 (Integer-based currency calculation to eliminate floating-point precision errors)
- **Deployment Target:** Vercel Monorepo (`vercel.json` rewrites) & Neon PostgreSQL with PgBouncer connection pooling
- **Local Development:** `docker-compose.yml` (100% feature parity with production)

---

## 📱 Responsive & Mobile-First UX Discipline

POSv1 is fully optimized for touch-based cashier operations from small smartphones (iPhone SE / 360px Android) up to wide dual-screen cashier terminals:

1. **360px Viewport Baseline:** Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
2. **Touch Targets $\ge 44 \times 44$px:** All interactive elements—navigation links, quantity steppers (`+` / `-`), filter inputs, and action buttons—meet or exceed accessibility touch guidelines.
3. **Adaptive Product Catalog Grid:**
   - `360–639px`: 1 column (`grid-cols-1`) with comfortable horizontal card layouts.
   - `640–1023px`: 2 columns (`sm:grid-cols-2`).
   - `1024–1279px`: 3 columns (`lg:grid-cols-3`).
   - `1280px+`: 4 columns (`xl:grid-cols-4`).
4. **Mobile Bottom Sheet Cart Drawer:** On compact screens (`< 1024px`), the shopping cart does not clutter the screen below products. A floating bottom bar displays `Total & Items Count`, and tapping it slides up a **Bottom Sheet Drawer** (max 85vh) for fast quantity adjustment and checkout.
5. **Data Table to Card List Transformation:** All analytical tables (Cashier Shift History, Product Catalog Management, Sales Audit Reports, and User Management) automatically transform into high-readability **Card Lists** on screens under 768px.
6. **Full-Screen Mobile Modals:** Payment processing, printable thermal receipts, and product creation dialogs transform into full-screen sheets on mobile (`< 640px`) with sticky action footers.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Golang 1.22+
- PostgreSQL 16 (or Docker)

---

### Option A: Local Development with Docker Compose

Run the entire stack (PostgreSQL + Go API + Next.js Frontend) with a single command:

```bash
docker compose up -d --build
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Database:** `localhost:5432`

To shut down:
```bash
docker compose down
```

---

### Option B: Manual Local Development

1. **Start PostgreSQL & apply database seeds:**
   ```bash
   psql -U postgres -d postgres -c "CREATE DATABASE kasirku_db;"
   psql -U postgres -d kasirku_db -f database/migrations/000001_init_schema.up.sql
   psql -U postgres -d kasirku_db -f database/seeds/001_seed_initial_data.sql
   ```

2. **Start Backend Go API:**
   ```bash
   cd backend
   go run cmd/api/main.go
   ```
   *Runs on `http://localhost:8080`*

3. **Start Next.js Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:3000`*

---

### Option C: Production Deployment on Vercel & Neon

1. **Link your repository to Vercel:**
   ```bash
   vercel link
   ```

2. **Integrate Neon PostgreSQL Storage:**
   - In your Vercel Dashboard, navigate to the **Storage** tab $\rightarrow$ select **Neon**.
   - Vercel automatically provisions the pooled database connection string `DATABASE_URL` (using Neon's `-pooler` endpoint) and `DATABASE_URL_UNPOOLED`.

3. **Run Database Migrations & Seeds on Neon:**
   ```bash
   psql "$DATABASE_URL_UNPOOLED" -f database/migrations/000001_init_schema.up.sql
   psql "$DATABASE_URL_UNPOOLED" -f database/seeds/001_seed_initial_data.sql
   ```

4. **Deploy to Vercel Production:**
   ```bash
   vercel deploy --prod
   ```
   *The root `vercel.json` automatically routes `/api/*` requests to the Go backend service and renders Next.js routes under the same origin.*

---

## 🔑 Demo Logins (Quick One-Click Login on UI)

The login screen at **[http://localhost:3000/login](http://localhost:3000/login)** includes one-click demo login buttons:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Admin (Owner / Manager)** | `admin@kasirku.com` | `admin123` | Executive Revenue Dashboard, Product & Inventory CRUD, Comprehensive Sales Reports, Staff User Management. |
| **Staff (Cashier)** | `cashier@kasirku.com` | `admin123` | Register (POS): Catalog search & Barcode Scan, Cart, Fast Checkout (Cash, Card, QRIS), Printable Receipt, My Shift History. *(Strictly forbidden from Admin routes)*. |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user & returns signed JWT token |
| `GET` | `/api/auth/me` | Authenticated | Returns currently logged-in user profile |
| `GET` | `/api/products` | Staff, Admin | Retrieves product catalog (filterable by search & active state) |
| `GET` | `/api/products/{id}` | Staff, Admin | Retrieves single product details |
| `POST` | `/api/products` | Admin Only | Creates a new product with SKU barcode and initial stock |
| `PUT` | `/api/products/{id}` | Admin Only | Updates product details (name, price, stock, active status) |
| `DELETE` | `/api/products/{id}` | Admin Only | Soft-deactivates product from active catalog |
| `POST` | `/api/transactions` | Staff, Admin | Processes checkout, decrements stock atomically in DB transaction |
| `GET` | `/api/transactions` | Staff, Admin | Lists transactions (Staff sees their shift; Admin sees all) |
| `GET` | `/api/transactions/{id}`| Staff, Admin | Retrieves full transaction invoice with line items |
| `GET` | `/api/reports/sales` | Admin Only | Aggregates gross revenue, total orders, AOV, and top 5 products |
| `GET` | `/api/users` | Admin Only | Lists system user accounts |
| `POST` | `/api/users` | Admin Only | Creates new cashier staff or admin account |
| `PUT` | `/api/users/{id}` | Admin Only | Toggles active status of an account |

---

## 🧪 Viewport & Responsive Verification Matrix

| Page / Feature | 360×640 (Small Phone) | 390×844 (iPhone 14) | 768×1024 (Tablet Portrait) | 1024×768 (Tablet Landscape) | 1280×800 (Laptop) | 1920×1080 (Desktop) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top Navigation** | Hamburger Drawer | Hamburger Drawer | Full Navbar Links | Full Navbar Links | Full Navbar Links | Full Navbar Links |
| **Login Screen** | Responsive Card | Responsive Card | Centered Modal Card | Centered Modal Card | Centered Modal Card | Centered Modal Card |
| **POS Product Grid** | 1 Column (Horizontal) | 1 Column (Horizontal) | 2 Columns | 3 Columns | 4 Columns | 4 Columns |
| **POS Cart** | Bottom Sheet Drawer | Bottom Sheet Drawer | Bottom Sheet Drawer | Right Panel (5 cols) | Right Panel (4 cols) | Right Panel (4 cols) |
| **Payment Modal** | Full-screen Dialog | Full-screen Dialog | Centered Dialog | Centered Dialog | Centered Dialog | Centered Dialog |
| **Receipt Modal** | Full-screen Dialog | Full-screen Dialog | Centered Dialog | Centered Dialog | Centered Dialog | Centered Dialog |
| **Cashier Shift History**| Responsive Card List | Responsive Card List | Data Table | Data Table | Data Table | Data Table |
| **Admin Dashboard** | Stacked Metric Cards | Stacked Metric Cards | 3-Column Metric Grid | 3-Column Metric Grid | 3-Column Metric Grid | 3-Column Metric Grid |
| **Products Management**| Card List + 44px Actions| Card List + 44px Actions| 7-Column Data Table | 7-Column Data Table | 7-Column Data Table | 7-Column Data Table |
| **Sales Audit Reports**| Filter Stack, Cards | Filter Stack, Cards | 6-Column Data Table | 6-Column Data Table | 6-Column Data Table | 6-Column Data Table |
| **User Management** | User Card List | User Card List | 6-Column Data Table | 6-Column Data Table | 6-Column Data Table | 6-Column Data Table |
| **Touch Targets $\ge 44$px** | ✅ Verified | ✅ Verified | ✅ Verified | ✅ Verified | ✅ Verified | ✅ Verified |
| **Horizontal Overflow** | Zero (`<= 360px`) | Zero | Zero | Zero | Zero | Zero |

---

## 📄 License
MIT License. Built for modern retail businesses and commercial POS environments.
