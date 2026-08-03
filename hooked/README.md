# Hooked — Crochet Shop

A Vite + React storefront for Hooked, a handmade crochet business (keychains, coasters, amigurumi, toys & custom orders).

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

Output goes to `dist/`, ready to deploy anywhere that serves static files (Netlify, Vercel, GitHub Pages, etc).

## Project structure

- `src/pages/` — Home, Shop (with category filter route `/shop/:category`), ProductDetail (`/product/:id`), Cart, CustomOrders, About, NotFound
- `src/components/` — Navbar, Footer, ProductCard, ProductArt (SVG illustrations), ThreadDivider, Toast, ScrollToTop
- `src/context/CartContext.jsx` — in-memory cart state (add/remove/update qty), shared via React Context
- `src/data/products.js` — product catalog; edit this file to add/remove/edit products, categories, prices, colors, descriptions
- `src/index.css` — design tokens (colors, fonts) + shared base styles; each page/component also has its own scoped `.css` file

## Customizing

- **Products**: edit `src/data/products.js`. Each product has `icon` (see `src/components/ProductArt.jsx` for available icons) — swap these for real photos later by replacing `<ProductArt>` with an `<img>`.
- **Colors/fonts**: edit the CSS variables at the top of `src/index.css`.
- **Custom order form**: currently front-end only (`src/pages/CustomOrders.jsx`) — wire the `onSubmit` handler up to your email service / form backend (e.g. Formspree, a serverless function) when ready.
- **Checkout**: the Cart page has a "Checkout" button as a placeholder — connect it to Stripe/Shopify/etc. when you're ready to accept real payments.
