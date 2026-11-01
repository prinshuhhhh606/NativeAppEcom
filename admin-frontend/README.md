# Bharat Bazaar — Pan-India E-Commerce Admin Panel

Production-grade Control Center for the Pan-India E-Commerce platform built with **React**, **Vite**, **Tailwind CSS**, and **Socket.IO Client**.

---

## 🚀 Key Modules & Capabilities

- **Real-Time Executive Analytics**:
  - Live revenue counter, today's sales, daily sales area charts using Recharts.
  - Multi-status order distribution donut charts.
  - Low-stock and out-of-stock live alerts.
  - Dynamic timeframe filters: Today, 7 Days, 30 Days, This Month, Custom.
- **Product & Catalog Management**:
  - Full CRUD with variant support (sizes, colors, storage).
  - Bulk CSV product export.
  - Instant badges toggle (Featured, Trending, Best Seller, Active/Draft).
- **Category Taxonomy**:
  - Hierarchy management, subcategory tags, banner media, and deletion safety checks (prevents accidental deletion of categories containing active products).
- **Atomic Inventory & Stock Management**:
  - Live stock tracking by SKU and warehouse location.
  - Stock In, Stock Out, and Adjustment workflows with required audit reasons.
  - Immutable `InventoryTransaction` audit trail logging previous quantity, new quantity, and delta.
- **Fulfillment & Order Management**:
  - Status transition validation engine (`Pending` $\to$ `Confirmed` $\to$ `Processing` $\to$ `Packed` $\to$ `Shipped` $\to$ `OutForDelivery` $\to$ `Delivered`).
  - Courier partner and AWB tracking code assignment.
  - Printable, GST-compliant Indian Tax Invoice with 9% CGST + 9% SGST / 18% IGST breakdown.
- **Customer Directory**:
  - Customer lifetime value (LTV) and total orders calculation.
  - Saved delivery address directory.
  - One-click account blocking / unblocking.
- **Coupons & Promotions**:
  - Percentage or flat amount discounts.
  - Minimum order value thresholds, maximum discount caps, usage limits, and expiration controls.
- **Payments & Gateway Reconciliation**:
  - Razorpay transactions and COD order settlement.
  - Automated gateway refund processing with audit logs.
- **Logistics & Shiprocket Adapter**:
  - Real-time shipment status advancement, tracking history, and milestone logs.
- **Returns & Refunds**:
  - Customer return inspection, approval/rejection, and automated stock restoration upon item receipt.
- **Store & Business Settings**:
  - GSTIN (15-digit), invoice prefix, Pan-India free shipping threshold (₹499 default), standard delivery charge, COD toggle, and return policies.
- **Real-Time WebSockets (Socket.IO)**:
  - Instant audio and visual toast alerts whenever a customer places an order, updates status, registers, or when stock runs low.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
cd admin-frontend
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```
The Admin Panel will open at `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized, minified bundle in `admin-frontend/dist/`.

---

## 🔐 Default Admin Credentials

Seeded via `npm run seed:admin` in the backend:
- **Super Admin**:
  - **Email**: `admin@appecom.in`
  - **Password**: `Admin@12345`
  - **Access**: Full unrestricted access
- **Store Manager**:
  - **Email**: `manager@appecom.in`
  - **Password**: `Manager@12345`
  - **Access**: Catalog, orders, customers, reviews

---

## 🔄 Real-Time Live Synchronization Architecture

```text
Customer React Native App
        │
        ▼ (Places Order / Registers / Requests Return)
Node.js + Express Backend
        │
        ├── Saves to MongoDB Atlas / Local
        ├── Atomic Inventory Decrement
        └── Socket.IO Real-Time Dispatch ('new_order', 'low_stock_alert')
                │
                ▼
React Admin Panel Dashboard (http://localhost:3000)
        ├── Audio & Toast Notification Popup
        ├── Increments Notification Bell Badge
        ├── Auto-refreshes Recent Orders Table
        └── Updates Live Revenue & Status Analytics
```

