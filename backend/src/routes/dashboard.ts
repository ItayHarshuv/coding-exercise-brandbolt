import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database';
import { Order, OrderStatus } from '../entities/Order';

const router = Router();

/**
 * GET /api/dashboard/stats
 *
 * TODO: Return dashboard statistics
 *
 * Response:
 *   {
 *     statusCounts: Record<OrderStatus, number>,  // Count of orders per status
 *     totalRevenue: number,                         // Sum of totalAmount for non-cancelled orders
 *     recentOrders: Order[]                         // Last 10 orders with customer relation
 *   }
 *
 * Steps:
 *   1. Query order counts grouped by status
 *   2. Query sum of totalAmount where status != CANCELLED
 *   3. Query the 10 most recent orders (ordered by createdAt DESC) with customer relation
 *   4. Return combined result
 */
router.get('/stats', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement dashboard stats
  res.status(501).json({ error: 'Not implemented: GET /api/dashboard/stats' });
});

export default router;
