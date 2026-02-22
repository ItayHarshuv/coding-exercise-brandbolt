import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './database';
import { seed } from './seed';
import { errorHandler } from './middleware/errorHandler';
import ordersRouter from './routes/orders';
import webhooksRouter from './routes/webhooks';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Customers & Products listing endpoints (provided for convenience)
app.get('/api/customers', async (_req, res, next) => {
  try {
    const { Customer } = await import('./entities/Customer');
    const customers = await AppDataSource.getRepository(Customer).find({ order: { name: 'ASC' } });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const { Product } = await import('./entities/Product');
    const products = await AppDataSource.getRepository(Product).find({ order: { name: 'ASC' } });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
AppDataSource.initialize()
  .then(async () => {
    console.log('[DB] Connected to PostgreSQL');
    await seed();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  });
