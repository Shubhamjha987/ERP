-- ============================================================
-- ERP SYSTEM - COMPLETE DATABASE SCHEMA (PostgreSQL 15+)
-- Version: 1.0.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE product_status AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');
CREATE TYPE supplier_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE warehouse_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE movement_type AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER');
CREATE TYPE reference_type AS ENUM ('PURCHASE_ORDER', 'SALES_ORDER', 'MANUAL');
CREATE TYPE purchase_order_status AS ENUM ('CREATED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE sales_order_status AS ENUM ('CREATED', 'CONFIRMED', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- ============================================================
-- MASTER TABLES
-- ============================================================

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id   BIGINT REFERENCES categories(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id                BIGSERIAL PRIMARY KEY,
    sku               VARCHAR(100) NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    category_id       BIGINT REFERENCES categories(id),
    unit_price        NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
    cost_price        NUMERIC(18,4) NOT NULL CHECK (cost_price >= 0),
    reorder_level     INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    reorder_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (reorder_quantity >= 0),
    unit_of_measure   VARCHAR(50) NOT NULL DEFAULT 'EACH',
    status            product_status NOT NULL DEFAULT 'ACTIVE',
    version           BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE suppliers (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    contact_name  VARCHAR(255),
    email         VARCHAR(255) UNIQUE,
    phone         VARCHAR(50),
    address       TEXT,
    city          VARCHAR(100),
    country       VARCHAR(100),
    tax_id        VARCHAR(100),
    payment_terms INTEGER DEFAULT 30,  -- days
    lead_time     INTEGER DEFAULT 7,   -- days
    status        supplier_status NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE,
    phone         VARCHAR(50),
    address       TEXT,
    city          VARCHAR(100),
    country       VARCHAR(100),
    tax_id        VARCHAR(100),
    credit_limit  NUMERIC(18,4) DEFAULT 0,
    status        customer_status NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE warehouses (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    code        VARCHAR(50) NOT NULL UNIQUE,
    location    TEXT,
    city        VARCHAR(100),
    country     VARCHAR(100),
    manager_id  BIGINT,
    status      warehouse_status NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_suppliers (
    product_id   BIGINT NOT NULL REFERENCES products(id),
    supplier_id  BIGINT NOT NULL REFERENCES suppliers(id),
    is_preferred BOOLEAN DEFAULT FALSE,
    lead_time    INTEGER,
    min_order_qty INTEGER DEFAULT 1,
    PRIMARY KEY (product_id, supplier_id)
);

-- ============================================================
-- SECURITY TABLES
-- ============================================================

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    role        user_role NOT NULL DEFAULT 'STAFF',
    warehouse_id BIGINT REFERENCES warehouses(id),
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INVENTORY TABLES (CRITICAL)
-- ============================================================

CREATE TABLE inventory (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id),
    warehouse_id        BIGINT NOT NULL REFERENCES warehouses(id),
    quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    version             BIGINT NOT NULL DEFAULT 0,
    last_updated        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id),
    CONSTRAINT chk_reserved_lte_quantity CHECK (reserved_quantity <= quantity)
);

-- Computed/derived column via generated column
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED;

CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id),
    movement_type   movement_type NOT NULL,
    quantity        INTEGER NOT NULL,  -- positive for IN, negative for OUT
    quantity_before INTEGER NOT NULL,
    quantity_after  INTEGER NOT NULL,
    reference_type  reference_type,
    reference_id    BIGINT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      BIGINT REFERENCES users(id)
);

-- ============================================================
-- PURCHASE ORDER TABLES
-- ============================================================

CREATE TABLE purchase_orders (
    id              BIGSERIAL PRIMARY KEY,
    order_number    VARCHAR(50) NOT NULL UNIQUE,
    supplier_id     BIGINT NOT NULL REFERENCES suppliers(id),
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id),
    status          purchase_order_status NOT NULL DEFAULT 'CREATED',
    total_amount    NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes           TEXT,
    expected_date   DATE,
    received_at     TIMESTAMP WITH TIME ZONE,
    approved_by     BIGINT REFERENCES users(id),
    approved_at     TIMESTAMP WITH TIME ZONE,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id                  BIGSERIAL PRIMARY KEY,
    purchase_order_id   BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    received_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    unit_cost           NUMERIC(18,4) NOT NULL CHECK (unit_cost >= 0),
    total_cost          NUMERIC(18,4) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    notes               TEXT,
    UNIQUE (purchase_order_id, product_id)
);

-- ============================================================
-- SALES ORDER TABLES
-- ============================================================

CREATE TABLE sales_orders (
    id              BIGSERIAL PRIMARY KEY,
    order_number    VARCHAR(50) NOT NULL UNIQUE,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id),
    status          sales_order_status NOT NULL DEFAULT 'CREATED',
    total_amount    NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes           TEXT,
    requested_date  DATE,
    shipped_at      TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_order_items (
    id              BIGSERIAL PRIMARY KEY,
    sales_order_id  BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
    total_price     NUMERIC(18,4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes           TEXT,
    UNIQUE (sales_order_id, product_id)
);

-- ============================================================
-- INDEXES (PERFORMANCE CRITICAL)
-- ============================================================

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_available ON inventory(available_quantity);

-- Inventory Movements (heavy query table)
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inv_movements_reference ON inventory_movements(reference_type, reference_id);

-- Purchase Orders
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_created_at ON purchase_orders(created_at);
CREATE INDEX idx_po_order_number ON purchase_orders(order_number);

-- Sales Orders
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_warehouse ON sales_orders(warehouse_id);
CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_created_at ON sales_orders(created_at);
CREATE INDEX idx_so_order_number ON sales_orders(order_number);

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p.reorder_level,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    i.quantity,
    i.reserved_quantity,
    i.available_quantity,
    p.cost_price,
    (i.quantity * p.cost_price) AS stock_value,
    CASE
        WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity <= p.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE p.status = 'ACTIVE';

CREATE OR REPLACE VIEW v_sales_analytics AS
SELECT
    DATE_TRUNC('day', so.created_at) AS order_date,
    COUNT(*) AS order_count,
    SUM(so.total_amount) AS daily_revenue,
    COUNT(DISTINCT so.customer_id) AS unique_customers
FROM sales_orders so
WHERE so.status NOT IN ('CANCELLED')
GROUP BY DATE_TRUNC('day', so.created_at);

CREATE OR REPLACE VIEW v_product_sales_velocity AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name,
    SUM(soi.quantity) AS total_sold,
    SUM(soi.total_price) AS total_revenue,
    COUNT(DISTINCT soi.sales_order_id) AS order_count
FROM sales_order_items soi
JOIN products p ON soi.product_id = p.id
JOIN sales_orders so ON soi.sales_order_id = so.id
WHERE so.status NOT IN ('CANCELLED')
  AND so.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.sku, p.name;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW