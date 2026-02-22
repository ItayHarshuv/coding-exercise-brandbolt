import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';

const router = Router();

/**
 * GET /api/orders
 *
 * TODO: List orders with filtering, sorting, and pagination
 *
 * Query parameters:
 *   - status: Filter by order status (e.g., "PENDING", "CONFIRMED"). Supports comma-separated values for multiple statuses.
 *   - search: Search by customer name (case-insensitive partial match)
 *   - sortBy: Column to sort by (default: "createdAt"). Options: "id", "status", "totalAmount", "createdAt"
 *   - sortDir: Sort direction - "ASC" or "DESC" (default: "DESC")
 *   - page: Page number, 1-indexed (default: 1)
 *   - pageSize: Items per page (default: 10). Options: 10, 25, 50
 *
 * Response: { data: Order[], total: number, page: number, pageSize: number }
 *
 * Each order should include the customer relation (for displaying customer name).
 */
router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement order listing with filters, sorting, and pagination
  res.status(501).json({ error: 'Not implemented: GET /api/orders' });
});

/**
 * POST /api/orders
 *
 * TODO: Create a new order
 *
 * Request body:
 *   {
 *     customerId: number,
 *     items: Array<{ productId: number, quantity: number }>,
 *     notes?: string
 *   }
 *
 * Steps:
 *   1. Validate that the customer exists
 *   2. Validate that all products exist and have sufficient stock
 *   3. Create OrderItem records with unitPrice from the product's current price and calculated lineTotal
 *   4. Calculate and set the order's totalAmount
 *   5. Save the order with status PENDING
 *   6. Return the created order with all relations
 *
 * Response: The created Order object with items and customer
 */
router.post('/', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement order creation
  res.status(501).json({ error: 'Not implemented: POST /api/orders' });
});

/**
 * GET /api/orders/:id
 *
 * TODO: Get a single order by ID
 *
 * Include relations: customer, items, items.product
 *
 * Response: The Order object with all relations
 * Error: 404 if not found
 */
router.get('/:id', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement get order by ID
  res.status(501).json({ error: 'Not implemented: GET /api/orders/:id' });
});

/**
 * PATCH /api/orders/:id
 *
 * TODO: Update an order's mutable fields
 *
 * Request body (all optional):
 *   {
 *     notes?: string,
 *     status?: OrderStatus
 *   }
 *
 * If status is being changed, trigger webhooks (call triggerWebhooks from webhook.service.ts).
 *
 * Response: The updated Order object
 * Error: 404 if not found
 */
router.patch('/:id', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement order update
  res.status(501).json({ error: 'Not implemented: PATCH /api/orders/:id' });
});

/**
 * PATCH /api/orders/:id/status
 *
 * TODO: Update only the status of an order with transition validation
 *
 * Request body:
 *   { status: OrderStatus }
 *
 * Valid transitions:
 *   PENDING -> CONFIRMED, CANCELLED
 *   CONFIRMED -> PROCESSING, CANCELLED
 *   PROCESSING -> SHIPPED, CANCELLED
 *   SHIPPED -> DELIVERED
 *   DELIVERED -> (none, terminal state)
 *   CANCELLED -> (none, terminal state)
 *
 * Steps:
 *   1. Find the order
 *   2. Validate the status transition is allowed
 *   3. Update the status
 *   4. Trigger webhooks with event "order.status.{NEW_STATUS}"
 *   5. Return the updated order
 *
 * Response: The updated Order object
 * Errors: 404 if not found, 400 if invalid transition
 */
router.patch('/:id/status', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement status transition with validation
  res.status(501).json({ error: 'Not implemented: PATCH /api/orders/:id/status' });
});

/**
 * POST /api/orders/bulk-status
 *
 * TODO: Update status for multiple orders at once
 *
 * Request body:
 *   {
 *     orderIds: number[],
 *     status: OrderStatus
 *   }
 *
 * Steps:
 *   1. Validate the target status
 *   2. For each order ID, attempt the status transition (same rules as PATCH /:id/status)
 *   3. Collect results: { succeeded: number[], failed: Array<{ id: number, reason: string }> }
 *   4. Trigger webhooks for each successfully updated order
 *
 * Response: { succeeded: number[], failed: Array<{ id: number, reason: string }> }
 */
router.post('/bulk-status', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement bulk status update
  res.status(501).json({ error: 'Not implemented: POST /api/orders/bulk-status' });
});

export default router;
