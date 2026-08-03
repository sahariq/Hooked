-- Phase 1: customer accounts, addresses, currency, payments

CREATE TABLE IF NOT EXISTS customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  phone          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        TEXT DEFAULT 'Home',       -- Home, Work, etc
  full_name    TEXT NOT NULL,
  phone        TEXT,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT,
  postal_code  TEXT,
  country_code TEXT NOT NULL,             -- ISO 3166-1 alpha-2, e.g. 'PK', 'US'
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);

-- manually-maintained fixed exchange rate table (base currency: PKR)
CREATE TABLE IF NOT EXISTS currency_rates (
  code         TEXT PRIMARY KEY,          -- 'USD', 'GBP', 'EUR', 'AED', 'PKR', ...
  name         TEXT NOT NULL,
  symbol       TEXT NOT NULL,
  rate_to_pkr  NUMERIC(12,4) NOT NULL,     -- how many PKR = 1 unit of this currency
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- maps countries to a default currency + whether COD is offered there
CREATE TABLE IF NOT EXISTS countries (
  code           TEXT PRIMARY KEY,        -- ISO 3166-1 alpha-2
  name           TEXT NOT NULL,
  default_currency TEXT NOT NULL REFERENCES currency_rates(code),
  cod_available  BOOLEAN DEFAULT FALSE,
  shipping_flat_cents INTEGER NOT NULL DEFAULT 0, -- flat shipping cost in PKR cents (paisa) for this country
  sort_order     INTEGER DEFAULT 100
);

-- link orders to a registered customer (nullable = guest checkout) + payment/currency info
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id       UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS country_code      TEXT,
  ADD COLUMN IF NOT EXISTS display_currency  TEXT DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS display_total     NUMERIC(12,2),  -- total converted to display_currency, for the receipt
  ADD COLUMN IF NOT EXISTS payment_method    TEXT DEFAULT 'card', -- 'card' (Safepay) or 'cod'
  ADD COLUMN IF NOT EXISTS payment_status    TEXT DEFAULT 'unpaid', -- unpaid, paid, failed, refunded
  ADD COLUMN IF NOT EXISTS safepay_tracker   TEXT; -- Safepay's tracker/order token for reconciliation

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- link carts to a customer once they log in (nullable = guest cart)
ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
