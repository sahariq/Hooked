import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from './pool.js';

dotenv.config();

const categories = [
  { slug: 'keychains', name: 'Keychains', blurb: 'Tiny charms for your keys, bag, or bestie', bg: '#F3D9CE', icon: 'strawberry', sort_order: 1 },
  { slug: 'coasters', name: 'Coasters', blurb: 'Granny-square sets for your morning coffee', bg: '#E4E9D8', icon: 'coaster', sort_order: 2 },
  { slug: 'amigurumi', name: 'Amigurumi', blurb: 'Sweet little characters, made to cuddle', bg: '#F5E2BC', icon: 'fox', sort_order: 3 },
  { slug: 'toys', name: 'Toys & Softies', blurb: 'Huggable, giftable, kid (and adult) approved', bg: '#F3E6D8', icon: 'bunny', sort_order: 4 },
];

const products = [
  { slug: 'strawberry-keychain', name: 'Strawberry Keychain', category: 'keychains', price: 800, bg: '#F3D9CE', icon: 'strawberry', badge: 'Best Seller', rating: 5, reviews: 128, colors: ['Classic Red', 'Blush Pink', 'Sunny Yellow'], description: 'A plump little strawberry charm, stitched tight and stuffed just right, finished with a leafy green cap and a gold clasp. Clips onto keys, bags, or belt loops.', details: ['Approx. 2 in (5 cm) tall', '100% cotton yarn, polyester fill', 'Gold-tone lobster clasp', 'Handwash cold, air dry'] },
  { slug: 'granny-coaster-set', name: 'Granny Square Coaster Set (4)', category: 'coasters', price: 1800, bg: '#E4E9D8', icon: 'coaster', badge: 'New', rating: 5, reviews: 64, colors: ['Sage Mix', 'Sunset Mix', 'Cream Mix'], description: 'Four classic granny-square coasters in a coordinated colorway, backed with a light cotton lining to protect your table. Sold as a set — mix and match colors on request.', details: ['4.25 in (11 cm) diameter, set of 4', '100% cotton yarn', 'Machine washable, lay flat to dry'] },
  { slug: 'baby-fox-amigurumi', name: 'Baby Fox Amigurumi', category: 'amigurumi', price: 2800, bg: '#F5E2BC', icon: 'fox', badge: null, rating: 5, reviews: 41, colors: ['Rust & Cream', 'Grey & Cream'], description: 'A pocket-sized fox with a fluffy tail and embroidered face, safety-tested and firmly stuffed. Sits upright on a shelf or curls up in a bag.', details: ['Approx. 5 in (13 cm) tall', 'Safety eyes, embroidered nose', 'Hand wash only', 'Made to order — 2 week lead time'] },
  { slug: 'bunny-softie', name: 'Bunny Softie Toy', category: 'toys', price: 3200, bg: '#F3E6D8', icon: 'bunny', badge: 'New', rating: 4, reviews: 19, colors: ['Oat', 'Dusty Pink', 'Sky Blue'], description: 'A long-eared bunny in soft cotton yarn, generously stuffed for cuddling. A sweet baby gift or a keeper for kids (and adults) of all ages.', details: ['Approx. 10 in (25 cm) tall', 'Hypoallergenic polyester fill', 'Surface wash only', 'Made to order — 2–3 week lead time'] },
  { slug: 'mini-flower-keychain', name: 'Mini Flower Keychain', category: 'keychains', price: 700, bg: '#E9D8E4', icon: 'flower', badge: null, rating: 5, reviews: 87, colors: ['Lilac', 'Coral', 'Buttercup'], description: 'A single crocheted bloom on a short beaded chain, light enough to clip onto anything without weighing it down.', details: ['Approx. 1.5 in (4 cm) flower', '100% cotton yarn', 'Gold-tone clasp'] },
  { slug: 'rainbow-coaster-set', name: 'Rainbow Coaster Set (4)', category: 'coasters', price: 2000, bg: '#D9E4E9', icon: 'target', badge: null, rating: 5, reviews: 33, colors: ['Rainbow Mix'], description: 'Bright concentric-ring coasters that work as a full rainbow set of four, or split up individually. A cheerful pop of color for any table.', details: ['4.25 in (11 cm) diameter, set of 4', '100% cotton yarn', 'Machine washable, lay flat to dry'] },
  { slug: 'mushroom-amigurumi-duo', name: 'Mushroom Amigurumi Duo', category: 'amigurumi', price: 2400, bg: '#F0DCC4', icon: 'mushroom', badge: 'Best Seller', rating: 5, reviews: 76, colors: ['Terracotta Pair', 'Rosy Pair'], description: 'Two friendly mushrooms, big and small, with a soft speckled cap and a chunky stem base. Sold as a matching pair.', details: ['3 in & 4.5 in (7.5 / 11 cm) tall', '100% cotton yarn, polyester fill', 'Hand wash only'] },
  { slug: 'star-plush-toy', name: 'Star Plush Toy', category: 'toys', price: 2200, bg: '#E0D8E9', icon: 'star', badge: null, rating: 5, reviews: 22, colors: ['Mustard', 'Lavender', 'Cream'], description: 'A pillowy five-point star with a stitched-on smile, soft enough for naptime and sturdy enough for daily hugs.', details: ['Approx. 8 in (20 cm) wide', 'Hypoallergenic polyester fill', 'Surface wash only'] },
  { slug: 'cherry-duo-keychain', name: 'Cherry Duo Keychain', category: 'keychains', price: 850, bg: '#E9CFCB', icon: 'strawberry', badge: null, rating: 5, reviews: 54, colors: ['Classic Red'], description: 'A pair of plump cherries joined at a woven green stem, finished with a sturdy clasp. A tiny, joyful everyday accessory.', details: ['Approx. 3 in (7.5 cm) total length', '100% cotton yarn, polyester fill', 'Gold-tone clasp'] },
  { slug: 'daisy-coaster-set', name: 'Daisy Coaster Set (4)', category: 'coasters', price: 2000, bg: '#F5EFD8', icon: 'coaster', badge: null, rating: 4, reviews: 15, colors: ['White & Yellow'], description: 'Petal-edged daisy coasters, crocheted flat and pressed for a crisp, tidy finish. A cheerful set for any kitchen.', details: ['4.5 in (11.5 cm) diameter, set of 4', '100% cotton yarn', 'Machine washable, lay flat to dry'] },
  { slug: 'sleepy-cat-amigurumi', name: 'Sleepy Cat Amigurumi', category: 'amigurumi', price: 2600, bg: '#E8DCEA', icon: 'fox', badge: 'New', rating: 5, reviews: 12, colors: ['Grey Tabby', 'Cream'], description: 'A curled-up cat with a stitched striped tail and sleepy embroidered eyes, weighted lightly at the base so it sits just right.', details: ['Approx. 4 in (10 cm) tall, 6 in (15 cm) long', 'Safety-tested embroidery, no small parts', 'Made to order — 2 week lead time'] },
  { slug: 'elephant-softie', name: 'Elephant Softie Toy', category: 'toys', price: 3400, bg: '#DCE3E9', icon: 'bunny', badge: null, rating: 5, reviews: 9, colors: ['Grey', 'Dusty Blue'], description: 'A round-bellied elephant with floppy ears and a curled trunk, stitched in a dense weave so it holds its shape through years of hugs.', details: ['Approx. 9 in (23 cm) tall', 'Hypoallergenic polyester fill', 'Surface wash only', 'Made to order — 2–3 week lead time'] },
];

async function seed() {
  console.log('Seeding categories...');
  const categoryIds = {};
  for (const c of categories) {
    const { rows } = await pool.query(
      `INSERT INTO categories (slug, name, blurb, bg, icon, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (slug) DO UPDATE SET name=$2, blurb=$3, bg=$4, icon=$5, sort_order=$6
       RETURNING id, slug`,
      [c.slug, c.name, c.blurb, c.bg, c.icon, c.sort_order]
    );
    categoryIds[rows[0].slug] = rows[0].id;
  }

  console.log('Seeding products...');
  for (const p of products) {
    await pool.query(
      `INSERT INTO products (slug, name, category_id, price_cents, bg, icon, badge, rating, reviews, description, details, colors)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (slug) DO UPDATE SET
         name=$2, category_id=$3, price_cents=$4, bg=$5, icon=$6, badge=$7,
         rating=$8, reviews=$9, description=$10, details=$11, colors=$12, updated_at=now()`,
      [
        p.slug, p.name, categoryIds[p.category], Math.round(p.price * 100), p.bg, p.icon,
        p.badge, p.rating, p.reviews, p.description, JSON.stringify(p.details), JSON.stringify(p.colors),
      ]
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hookedcrochet.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
  const hash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash=$2`,
    [adminEmail, hash]
  );
  console.log(`Admin user ready: ${adminEmail} (password set from ADMIN_PASSWORD or default 'changeme123')`);

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
