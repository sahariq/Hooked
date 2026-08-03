import { pool } from './pool.js';

// Fixed exchange rates: how many PKR equal 1 unit of the currency.
// You (or the admin dashboard, once built) should update these periodically —
// they are NOT pulled live.
const currencies = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', rate: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 280 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 355 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 300 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate: 76 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 205 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 185 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate: 74.5 },
];

// A starter set of countries. cod_available is true only for Pakistan for now.
// shippingFlatPkr is a flat shipping charge in PKR for orders shipping to that country.
const countries = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR', cod: true, shippingFlatPkr: 250, sort: 1 },
  { code: 'US', name: 'United States', currency: 'USD', cod: false, shippingFlatPkr: 3500, sort: 2 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', cod: false, shippingFlatPkr: 3200, sort: 3 },
  { code: 'CA', name: 'Canada', currency: 'CAD', cod: false, shippingFlatPkr: 3800, sort: 4 },
  { code: 'AU', name: 'Australia', currency: 'AUD', cod: false, shippingFlatPkr: 4200, sort: 5 },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', cod: false, shippingFlatPkr: 2200, sort: 6 },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', cod: false, shippingFlatPkr: 2400, sort: 7 },
  { code: 'DE', name: 'Germany', currency: 'EUR', cod: false, shippingFlatPkr: 3600, sort: 8 },
  { code: 'FR', name: 'France', currency: 'EUR', cod: false, shippingFlatPkr: 3600, sort: 9 },
];

async function seedCurrenciesAndCountries() {
  console.log('Seeding currency rates...');
  for (const c of currencies) {
    await pool.query(
      `INSERT INTO currency_rates (code, name, symbol, rate_to_pkr)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (code) DO UPDATE SET name=$2, symbol=$3, rate_to_pkr=$4, updated_at=now()`,
      [c.code, c.name, c.symbol, c.rate]
    );
  }

  console.log('Seeding countries...');
  for (const c of countries) {
    await pool.query(
      `INSERT INTO countries (code, name, default_currency, cod_available, shipping_flat_cents, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (code) DO UPDATE SET
         name=$2, default_currency=$3, cod_available=$4, shipping_flat_cents=$5, sort_order=$6`,
      [c.code, c.name, c.currency, c.cod, c.shippingFlatPkr * 100, c.sort]
    );
  }

  console.log('Currency + country seed complete.');
}

// allow running standalone: `node src/db/seedCurrency.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCurrenciesAndCountries()
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}

export { seedCurrenciesAndCountries };
