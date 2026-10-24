-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'SATYA SAI MEDICAL AGENCIES',
    "address" TEXT NOT NULL DEFAULT 'plot no 143, Road No 8, Mothevari Thota, Pathebad, ELURU - 534002',
    "phone" TEXT NOT NULL DEFAULT '9491722324',
    "gstin" TEXT NOT NULL DEFAULT '37CBNPB8185P1ZR',
    "dl_20b" TEXT NOT NULL DEFAULT 'AP/05/01/2014-120610',
    "dl_21b" TEXT NOT NULL DEFAULT 'AP/05/01/2014-120611',
    "state" TEXT NOT NULL DEFAULT 'AP',
    "state_code" TEXT NOT NULL DEFAULT '37',
    "bank_name" TEXT NOT NULL DEFAULT 'State Bank of India R.R.Pet, Eluru. BR',
    "account_no" TEXT NOT NULL DEFAULT '37047328014',
    "ifsc_code" TEXT NOT NULL DEFAULT 'SBIN0009771',
    "terms" TEXT NOT NULL DEFAULT 'Drugs Supplied comply with Sec 18 of Drugs & Cosmetics Act 1940 and Rules there under. Goods sold on understanding buyer holds requisite drug municipal tax. No claims for shortages/breakages once goods leave our premises. All disputes subject to Eluru Jurisdiction only.',
    "invoice_prefix" TEXT NOT NULL DEFAULT 'A',
    "next_seq" INTEGER NOT NULL DEFAULT 35
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT NOT NULL DEFAULT '',
    "dl_20b" TEXT NOT NULL DEFAULT '',
    "dl_21b" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "state_code" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mfr" TEXT NOT NULL DEFAULT '',
    "hsn" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL DEFAULT '',
    "expiry" TEXT NOT NULL DEFAULT '',
    "uom" TEXT NOT NULL DEFAULT 'NOS',
    "mrp" REAL NOT NULL DEFAULT 0,
    "ptr" REAL NOT NULL DEFAULT 0,
    "default_rate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_no" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "ship_to_client_id" INTEGER,
    "total_qty" INTEGER NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "round_off" REAL NOT NULL DEFAULT 0,
    "net_total" REAL NOT NULL DEFAULT 0,
    "amount_in_words" TEXT NOT NULL DEFAULT '',
    "attachment_path" TEXT,
    "is_quotation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_ship_to_client_id_fkey" FOREIGN KEY ("ship_to_client_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "mfr" TEXT NOT NULL DEFAULT '',
    "hsn" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "batch_no" TEXT NOT NULL DEFAULT '',
    "expiry" TEXT NOT NULL DEFAULT '',
    "uom" TEXT NOT NULL DEFAULT '',
    "mrp" REAL NOT NULL DEFAULT 0,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "free" INTEGER NOT NULL DEFAULT 0,
    "rate" REAL NOT NULL DEFAULT 0,
    "ptr" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "discount_pct" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceItem_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_no_key" ON "Invoice"("invoice_no");
