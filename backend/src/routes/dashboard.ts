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
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const statusRows = await orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    const statusCounts: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    for (const row of statusRows) {
      statusCounts[row.status] = Number.parseInt(row.count, 10) || 0;
    }

    const revenueRaw = await orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'totalRevenue')
      .where('order.status != :status', { status: OrderStatus.CANCELLED })
      .getRawOne<{ totalRevenue: string }>();

    const totalRevenue = Number(revenueRaw?.totalRevenue ?? 0);
    const recentOrders = await orderRepo.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    res.json({ statusCounts, totalRevenue, recentOrders });
  } catch (err) {
    _next(err);
  }
});

export default router;
