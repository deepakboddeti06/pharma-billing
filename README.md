# Satya Sai Medical Agencies — Billing & Invoicing Suite

A fast, offline-first billing and invoicing desktop web app tailored for medical agencies and pharma distribution businesses in Andhra Pradesh, India. Reproduces the traditional **BILL OF SUPPLY** pharmacy format with exact A4 landscape printing and multi-client dispatching.

---

## 🚀 Features

- **Store-Centric App Flow**:
  - **Clients & Tablets Dashboard**: Card grid for shops with quick actions, search, and tablet management.
  - **Shop Detail Page**: Product catalog with quantity steppers (`+` / `-`), fast multi-item selection, and one-click "Generate Bill of Supply".
  - **Client Billing History**: Direct access to past bills generated for each medical store.

- **Exact "BILL OF SUPPLY" Reproduction**:
  - Compliant with Indian Drugs & Cosmetics Act and AP State requirements.
  - Multi-column landscape table: `MFR`, `HSN`, `Batch No`, `Expiry`, `UOM`, `MRP`, `Qty`, `Free`, `Rate`, `PTR`, `Amount`, `Discount %`, `Total`.
  - Automatic calculation of subtotal, bill discount, nearest rupee round-off, and net payable.
  - Indian rupee-to-words generator (Crore, Lakh, Thousand).
  - Supplier, Billed To, and Shipped To (Consignee) three-party blocks.
  - Bank account details, terms & conditions, and authorized signatory.

- **Offline-First & Local Storage**:
  - Local SQLite database file (`prisma/dev.db`).
  - One-click live database backup download (`.db`).
  - Instant timestamped snapshot creation to `server/backups/`.

- **Analytics & Export**:
  - Sales summary by client/shop with revenue share ranking.
  - Monthly turnover tracking.
  - 1-click **Excel (.xlsx)** invoice ledger export.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, TanStack React Query, React Router v6
- **Backend**: Node.js, Express, Multer, XLSX
- **Database & ORM**: SQLite, Prisma ORM
- **Print Engine**: Pure CSS `@media print` tuned for A4 Landscape sheets

---

## 📋 Quick Setup & Running Locally

### 1. Requirements
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 2. Install Dependencies & Setup Database

From the root directory (`pharma-billing2/`):

```bash
# Install root, server, and client dependencies
npm run setup
```

Or manually:
```bash
# 1. Install root dependencies
npm install

# 2. Setup server & database
cd server
npm install
npx prisma migrate dev --name init
npm run prisma:seed
cd ..

# 3. Setup client
cd client
npm install
cd ..
```

### 3. Start the Application

```bash
npm run dev
```

This starts both servers simultaneously:
- **Client (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **API Server (Backend)**: [http://localhost:3001](http://localhost:3001)

Open your browser to [http://localhost:5173](http://localhost:5173) to start billing!

---

## 🖨️ Printing & PDF Guide

When viewing any invoice at `/invoices/:id`:
1. Click the green **"Print / Save as PDF"** button.
2. In the browser print dialog:
   - **Destination**: Choose your physical printer or **"Save as PDF"**.
   - **Layout**: **Landscape** (default configured in CSS).
   - **Paper Size**: **A4**.
   - **Margins**: **Default** or **None**.
   - **Options**: Ensure **"Background graphics"** is checked so table headers and borders render crisply.

---

## 📁 Project Structure

```
pharma-billing2/
├── package.json             # Root monorepo script coordinator (concurrently)
├── README.md
├── server/
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma   # BusinessSettings, Client, Product, Invoice, InvoiceItem
│   │   ├── seed.js         # Seed data (Satya Sai Medical Agencies + Sri Ayyappasai)
│   │   └── dev.db          # Local SQLite database file
│   └── src/
│       ├── index.js        # Express server entry point
│       ├── prisma.js       # Prisma client singleton
│       ├── routes/
│       │   ├── settings.js # GET/PUT business settings
│       │   ├── clients.js  # CRUD clients/medical stores
│       │   ├── products.js # CRUD tablets/products
│       │   ├── invoices.js # Invoice creation, atomic transactions, next-number
│       │   ├── reports.js  # Sales aggregation and Excel (.xlsx) export
│       │   └── backup.js   # Live .db streaming and local snapshots
│       └── utils/
│           └── numberToWords.js # Indian numbering system converter
└── client/
    ├── package.json
    ├── vite.config.js       # Proxies /api to http://localhost:3001
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx          # Route definitions
        ├── index.css        # Tailwind + A4 Landscape @media print engine
        ├── api/api.js       # Axios base client
        ├── components/
        │   ├── common/      # ClientModal, ProductModal
        │   └── layout/      # Layout, Sidebar, Topbar
        └── pages/
            ├── Dashboard.jsx   # Clients grid & tablets master
            ├── ClientPage.jsx  # Shop profile, quantity steppers, order history
            ├── ClientEdit.jsx  # Full shop registration & edit
            ├── InvoiceNew.jsx  # Multi-line invoice builder with live math
            ├── InvoiceView.jsx # A4 Landscape BILL OF SUPPLY preview & print
            ├── AllInvoices.jsx # Searchable invoice ledger
            ├── Reports.jsx     # Sales analytics & Excel download
            └── Settings.jsx    # Agency details & database backups
```
