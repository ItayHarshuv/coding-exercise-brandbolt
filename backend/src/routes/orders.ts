import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { triggerWebhooks } from '../services/webhook.service';

const router = Router();
const ALLOWED_SORT_COLUMNS = new Set(['id', 'status', 'totalAmount', 'createdAt']);
const ALLOWED_PAGE_SIZES = new Set([10, 25, 50]);
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

function isOrderStatus(value: string): value is OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus);
}

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

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
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const rawStatus = String(req.query.status ?? '').trim();
    const search = String(req.query.search ?? '').trim();
    const sortBy = String(req.query.sortBy ?? 'createdAt');
    const sortDirRaw = String(req.query.sortDir ?? 'DESC').toUpperCase();
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const requestedPageSize = Number.parseInt(String(req.query.pageSize ?? '10'), 10) || 10;
    const pageSize = ALLOWED_PAGE_SIZES.has(requestedPageSize) ? requestedPageSize : 10;
    const sortColumn = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortDirRaw === 'ASC' ? 'ASC' : 'DESC';
    const statuses = rawStatus
      .split(',')
      .map((status) => status.trim())
      .filter((status): status is OrderStatus => isOrderStatus(status));

    const query = orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy(`order.${sortColumn}`, sortDir);

    if (statuses.length > 0) {
      query.andWhere('order.status IN (:...statuses)', { statuses });
    }

    if (search.length > 0) {
      query.andWhere('LOWER(customer.name) LIKE :search', { search: `%${search.toLowerCase()}%` });
    }

    query.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await query.getManyAndCount();
    res.json({ data, total, page, pageSize });
  } catch (err) {
    next(err);
  }
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
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, items, notes } = req.body as {
      customerId?: number;
      items?: Array<{ productId: number; quantity: number }>;
      notes?: string;
    };
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'customerId and at least one item are required' });
      return;
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const productRepo = AppDataSource.getRepository(Product);
    const orderRepo = AppDataSource.getRepository(Order);

    const customer = await customerRepo.findOne({ where: { id: customerId } });
    if (!customer) {
      res.status(400).json({ error: 'Customer not found' });
      return;
    }

    const productIds = items.map((item) => item.productId);
    const products = await productRepo.findByIds(productIds);
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        res.status(400).json({ error: `Invalid quantity for product ${item.productId}` });
        return;
      }
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (item.quantity > product.stockQuantity) {
        res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        return;
      }
    }

    const orderItems: OrderItem[] = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      const orderItem = new OrderItem();
      orderItem.productId = product.id;
      orderItem.quantity = item.quantity;
      orderItem.unitPrice = unitPrice;
      orderItem.lineTotal = lineTotal;
      return orderItem;
    });

    const totalAmount = orderItems.reduce((acc, item) => acc + Number(item.lineTotal), 0);
    const order = orderRepo.create({
      customerId,
      items: orderItems,
      notes: notes?.trim() || null,
      status: OrderStatus.PENDING,
      totalAmount,
    });

    const savedOrder = await orderRepo.save(order);
    const hydratedOrder = await orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['customer', 'items', 'items.product'],
    });

    res.status(201).json(hydratedOrder);
  } catch (err) {
    next(err);
  }
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
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const order = await AppDataSource.getRepository(Order).findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
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
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { notes, status } = req.body as { notes?: string; status?: OrderStatus };
    const orderRepo = AppDataSource.getRepository(Order);

    const order = await orderRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const previousStatus = order.status;
    if (typeof notes !== 'undefined') {
      order.notes = notes?.trim() || null;
    }
    if (typeof status !== 'undefined') {
      if (!isOrderStatus(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      order.status = status;
    }

    const updated = await orderRepo.save(order);
    if (status && status !== previousStatus) {
      await triggerWebhooks(order.id, `order.status.${status}`, {
        previousStatus,
        status,
        order: updated,
      });
    }

    const refreshed = await orderRepo.findOne({
      where: { id: updated.id },
      relations: ['customer', 'items', 'items.product'],
    });
    res.json(refreshed);
  } catch (err) {
    next(err);
  }
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
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body as { status?: OrderStatus };
    if (!status || !isOrderStatus(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!canTransition(order.status, status)) {
      res.status(400).json({ error: `Invalid status transition: ${order.status} -> ${status}` });
      return;
    }

    const previousStatus = order.status;
    order.status = status;
    const updated = await orderRepo.save(order);
    await triggerWebhooks(updated.id, `order.status.${status}`, {
      previousStatus,
      status,
      order: updated,
    });

    const refreshed = await orderRepo.findOne({
      where: { id: updated.id },
      relations: ['customer', 'items', 'items.product'],
    });
    res.json(refreshed);
  } catch (err) {
    next(err);
  }
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
router.post('/bulk-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderIds, status } = req.body as { orderIds?: number[]; status?: OrderStatus };
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'orderIds must be a non-empty array' });
      return;
    }
    if (!status || !isOrderStatus(status)) {
      res.status(400).json({ error: 'Valid target status is required' });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const succeeded: number[] = [];
    const failed: Array<{ id: number; reason: string }> = [];

    for (const id of orderIds) {
      const order = await orderRepo.findOne({
        where: { id },
        relations: ['customer', 'items', 'items.product'],
      });
      if (!order) {
        failed.push({ id, reason: 'Order not found' });
        continue;
      }

      if (!canTransition(order.status, status)) {
        failed.push({ id, reason: `Invalid transition: ${order.status} -> ${status}` });
        continue;
      }

      const previousStatus = order.status;
      order.status = status;
      const updated = await orderRepo.save(order);
      succeeded.push(id);
      await triggerWebhooks(updated.id, `order.status.${status}`, {
        previousStatus,
        status,
        order: updated,
      });
    }

    res.json({ succeeded, failed });
  } catch (err) {
    next(err);
  }
});

export default router;
