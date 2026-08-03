# Hooked — Full Stack Crochet Store (Islamabad, Pakistan, ships worldwide)

Two projects:

- **`hooked/`** — the React storefront (Vite + React Router), coquette pink/blue themed with crochet motifs (hooks, scissors, stitches) throughout
- **`hooked-backend/`** — the Node/Express + PostgreSQL API (products, cart, orders, customer accounts, currency, admin)

## 1. Set up the database

```bash
createuser hooked --pwprompt
createdb hooked --owner=hooked
```

## 2. Set up the backend

```bash
cd hooked-backend
cp .env.example .env
# edit .env — see "Environment variables" below

npm install
npm run migrate        # creates all tables
npm run seed            # loads categories + 12 starter products (priced in PKR) + admin user
npm run seed:currency  # loads currency rates + countries (Pakistan + 8 international)
npm run dev              # starts the API on http://localhost:4000
```

## 3. Set up the frontend

```bash
cd hooked
cp .env.example .env
# VITE_API_URL should point at your backend

npm install
npm run dev   # http://localhost:5173
```

## What's new in this build

### Localization
- First-visit popup asks "where are you shopping from?" → sets country + currency, persisted in `localStorage`
- Prices are stored in **PKR** (the store's real base currency) and converted for display using a **fixed rate table** you control (`currency_rates` table) — no live exchange-rate API dependency
- Shipping cost is looked up per-country (`countries` table) — Pakistan gets a cheap domestic rate, other countries get flat international rates you can tune later
- Currency pill in the navbar lets shoppers reopen the popup and change their country anytime

### Customer accounts
- Email/password signup + login (JWT, separate token namespace from admin so the two can never cross-authenticate)
- Account page: order history + saved addresses (add/remove, default address)
- Guest checkout is still fully supported — accounts are optional, not required

### Checkout & payments
- **Cash on Delivery** — only offered when shipping to Pakistan (enforced server-side, not just hidden in the UI)
- **Card payments via Safepay** — the Pakistani gateway that lets a Pakistan-registered business accept international cards. See `hooked-backend/src/services/safepay.js`.
  - **No live Safepay account yet?** No problem — without `SAFEPAY_API_KEY` set, the backend automatically falls back to a mock checkout session so you can build/test the entire flow. The confirmation page has a "Pay via Safepay" button that simulates a successful payment in this mode.
  - Once you have real Safepay merchant credentials, just fill in the env vars — no code changes needed.
- Order confirmation page (`/order/:id`) shows the itemized receipt in the customer's chosen currency
- Order confirmation emails via **Resend** — without `RESEND_API_KEY` set, emails are logged to the console instead of sent, so this also works out of the box in development

### Admin dashboard (`/admin`)
- Dashboard stats, order management (status updates), custom order request tracking, product CRUD
- Fully separate JWT auth from customer accounts

### Crochet motifs
- A small shared icon library (`hooked/src/components/CrochetMotifs.jsx`) — scissors, crochet hook, yarn ball, stitch marks, a "snip" divider — reused across the navbar, hero, section dividers, footer, and custom order page instead of one-off icons, so the handmade feel stays consistent site-wide.

## Environment variables (backend)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs both admin and customer tokens (they're namespaced separately internally) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeds your first admin login |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `SAFEPAY_API_KEY` / `SAFEPAY_SECRET` / `SAFEPAY_WEBHOOK_SECRET` | Leave blank to use mock payments during development |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Leave blank to log emails to console during development |

## How the pieces fit together

```
Storefront (React, Vercel)
  Currency popup → /api/currency/countries, /api/currency/rates
  /shop, /product/:id     → /api/products, /api/categories
  /cart, checkout          → /api/cart, /api/orders (COD or Safepay)
  /order/:id                → /api/orders/:id (+ mock-pay in dev)
  /login, /signup, /account → /api/customers/*
  /custom                    → /api/custom-orders
  /admin/*  (separate auth)  → /api/admin/*, /api/orders, /api/products, /api/custom-orders
        ↓
Express API (Railway)
        ↓
PostgreSQL (Railway) — products, categories, customers, addresses, carts, orders,
                        custom_orders, currency_rates, countries, admins
```

- Orders snapshot the product name/price at time of purchase (`order_items`), so later price or product edits don't rewrite order history.
- `display_currency` + `display_total` on each order are a snapshot too — even if you update exchange rates later, past receipts stay accurate to what the customer actually saw.
- Product deletion is a soft delete (`is_active = false`) so past orders keep valid references.

## Deploying

- **Frontend → Vercel**: point it at `hooked/`, set `VITE_API_URL` to your deployed backend's `/api` URL.
- **Backend → Railway**: deploy `hooked-backend/`, attach a Railway Postgres addon, set `DATABASE_URL` to Railway's connection string, run `npm run migrate && npm run seed && npm run seed:currency` once via Railway's shell, set `CORS_ORIGIN` to your Vercel domain.

## Honest gaps / next steps

- **Real Safepay account**: the integration is built to spec but untested against a live merchant account — recommend a test transaction together once you have credentials.
- **Real emails**: same story with Resend — works today via console logging, needs an API key to actually send.
- **Admin dashboard is not yet a separate deployable app** — it currently lives at `/admin` inside the same storefront React app. If you want it on its own subdomain (e.g. `admin.hookedcrochet.com`) as originally planned, that's a follow-up: splitting it into its own Vite project is straightforward since the admin pages are already self-contained.
- **Currency rates need manual updates** — there's no admin UI screen for editing `currency_rates` yet (the API endpoint exists: `PUT /api/currency/rates/:code`), just no button for it in the dashboard yet.
- **No password reset flow** for customer accounts yet.
