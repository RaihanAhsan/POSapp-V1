# POSv1 - Frontend (Next.js 16)

The web frontend client for the POSv1 Point of Sale system, built using Next.js 16 App Router, TypeScript, and Tailwind CSS v4.

## Features
- **Mobile-First UX:** Built and verified for viewports down to 360px (iPhone SE / compact Android) up to 4K displays.
- **Touch-Friendly Controls:** All interactive buttons and quantity steppers strictly follow touch targets $\ge 44 \times 44$px.
- **Role-Based Access Control (RBAC):** Distinct routes and interfaces for Admin (Manager) vs. Staff (Cashier).
- **Fast Checkout Flow:** Instant product catalog search, barcode / SKU auto-recognition, responsive cart with mobile slide-up bottom drawer, payment modal (Cash, Card, QRIS), and printable receipts.

## Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## Build for Production
```bash
npm run build
npm run start
```
