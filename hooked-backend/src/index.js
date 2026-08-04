import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import customOrdersRouter from './routes/customOrders.js';
import adminRouter from './routes/admin.js';
import customersRouter from './routes/customers.js';
import currencyRouter from './routes/currency.js';

dotenv.config();

const app = express();

app.get('/api/setup', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    exec('npm run migrate && npm run seed && npm run seed:currency', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).send(`Error: ${stderr}`);
      }
      res.send(`Success: ${stdout}`);
    });
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'hooked-backend' }));

app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/custom-orders', customOrdersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);
app.use('/api/currency', currencyRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hooked backend running on http://localhost:${PORT}`);
});
