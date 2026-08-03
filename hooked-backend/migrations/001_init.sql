-- Hooked storefront schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  blurb       TEXT,
  bg          TEXT DEFAULT '#F6D9E4',
  icon        TEXT DEFAULT 'star',
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
  bg           TEXT DEFAULT '#F6D9E4',
  icon         TEXT DEFAULT 'star',
  badge        TEXT,                 -- e.g. 'New', 'Best Seller', or NULL
  rating       NUMERIC(2,1) DEFAULT 5.0,
  reviews      INTEGER DEFAULT 0,
  description  TEXT,
  details      JSONB DEFAULT '[]',    -- array of strings
  colors       JSONB DEFAULT '[]',    -- array of strings
  stock        INTEGER DEFAULT 999,   -- inventory count; used for "made to order" items too
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE TABLE IF NOT EXISTS carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       TEXT,
  qty         INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cart_id, product_id, color)
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      TEXT UNIQUE NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  shipping_address  JSONB NOT NULL DEFAULT '{}',
  subtotal_cents    INTEGER NOT NULL,
  shipping_cents    INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending, paid, in_progress, shipped, completed, cancelled
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,   -- snapshot at time of order
  price_cents   INTEGER NOT NULL,
  color         TEXT,
  qty           INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  category     TEXT,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new', -- new, quoted, approved, in_progress, shipped, closed
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);
