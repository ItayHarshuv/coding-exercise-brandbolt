import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database';
import { WebhookSubscription } from '../entities/WebhookSubscription';
import { WebhookDelivery } from '../entities/WebhookDelivery';
import { retryWebhookDelivery } from '../services/webhook.service';
import axios from 'axios';
import crypto from 'crypto';

const router = Router();
const DEFAULT_PAGE_SIZE = 20;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function signPayload(payload: Record<string, any>, secret: string): string {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

async function sendAndRecordDelivery(
  subscription: WebhookSubscription,
  payload: Record<string, any>,
  attemptNumber: number
): Promise<WebhookDelivery> {
  const deliveryRepo = AppDataSource.getRepository(WebhookDelivery);
  const signature = signPayload(payload, subscription.secret);

  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let success = false;

  try {
    const response = await axios.post(subscription.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
      },
      validateStatus: () => true,
    });
    statusCode = response.status;
    responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    success = response.status >= 200 && response.status < 300;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status ?? undefined;
      if (typeof error.response?.data === 'string') {
        responseBody = error.response.data;
      } else if (error.response?.data != null) {
        responseBody = JSON.stringify(error.response.data);
      } else {
        responseBody = error.message;
      }
    } else if (error instanceof Error) {
      responseBody = error.message;
    } else {
      responseBody = 'Unknown webhook delivery error';
    }
  }

  const delivery = new WebhookDelivery();
  delivery.subscriptionId = subscription.id;
  delivery.orderId = Number(payload.orderId ?? 0);
  delivery.event = String(payload.event ?? 'test');
  delivery.payload = payload;
  delivery.statusCode = (statusCode ?? null) as any;
  delivery.responseBody = (responseBody ?? null) as any;
  delivery.success = success;
  delivery.attemptNumber = attemptNumber;
  delivery.deliveredAt = new Date();

  return deliveryRepo.save(delivery);
}

/**
 * GET /api/webhooks
 *
 * TODO: List all webhook subscriptions
 *
 * Response: Array of WebhookSubscription objects
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await AppDataSource.getRepository(WebhookSubscription).find({
      order: { createdAt: 'DESC' },
    });
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/webhooks
 *
 * TODO: Create a new webhook subscription
 *
 * Request body:
 *   {
 *     url: string,        // The URL to send webhooks to
 *     secret: string,     // Secret used for HMAC signing
 *     events: string[],   // Array of event types to subscribe to
 *                          // e.g., ["order.status.CONFIRMED", "order.status.SHIPPED"]
 *     isActive?: boolean  // Default: true
 *   }
 *
 * Validation:
 *   - url is required and must be a valid URL
 *   - secret is required
 *   - events must be a non-empty array
 *
 * Response: The created WebhookSubscription
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, secret, events, isActive } = req.body as {
      url?: string;
      secret?: string;
      events?: string[];
      isActive?: boolean;
    };

    if (!url || !isValidUrl(url)) {
      res.status(400).json({ error: 'Valid url is required' });
      return;
    }
    if (!secret || !secret.trim()) {
      res.status(400).json({ error: 'secret is required' });
      return;
    }
    if (!Array.isArray(events) || events.length === 0 || events.some((event) => !event || !event.trim())) {
      res.status(400).json({ error: 'events must be a non-empty string array' });
      return;
    }

    const repo = AppDataSource.getRepository(WebhookSubscription);
    const created = repo.create({
      url: url.trim(),
      secret: secret.trim(),
      events: events.map((event) => event.trim()),
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });
    const saved = await repo.save(created);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/webhooks/:id
 *
 * TODO: Update a webhook subscription
 *
 * Request body (all optional):
 *   {
 *     url?: string,
 *     secret?: string,
 *     events?: string[],
 *     isActive?: boolean
 *   }
 *
 * Response: The updated WebhookSubscription
 * Error: 404 if not found
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const repo = AppDataSource.getRepository(WebhookSubscription);
    const subscription = await repo.findOne({ where: { id } });
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const { url, secret, events, isActive } = req.body as {
      url?: string;
      secret?: string;
      events?: string[];
      isActive?: boolean;
    };

    if (typeof url !== 'undefined') {
      if (!url || !isValidUrl(url)) {
        res.status(400).json({ error: 'Valid url is required' });
        return;
      }
      subscription.url = url.trim();
    }
    if (typeof secret !== 'undefined') {
      if (!secret.trim()) {
        res.status(400).json({ error: 'secret cannot be empty' });
        return;
      }
      subscription.secret = secret.trim();
    }
    if (typeof events !== 'undefined') {
      if (!Array.isArray(events) || events.length === 0 || events.some((event) => !event || !event.trim())) {
        res.status(400).json({ error: 'events must be a non-empty string array' });
        return;
      }
      subscription.events = events.map((event) => event.trim());
    }
    if (typeof isActive === 'boolean') {
      subscription.isActive = isActive;
    }

    const updated = await repo.save(subscription);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/webhooks/:id
 *
 * TODO: Delete a webhook subscription
 *
 * Response: 204 No Content
 * Error: 404 if not found
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const repo = AppDataSource.getRepository(WebhookSubscription);
    const subscription = await repo.findOne({ where: { id } });
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }
    await repo.remove(subscription);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 *
 * TODO: Get delivery log for a specific subscription
 *
 * Query parameters:
 *   - page: Page number (default: 1)
 *   - pageSize: Items per page (default: 20)
 *
 * Response: { data: WebhookDelivery[], total: number, page: number, pageSize: number }
 * Error: 404 if subscription not found
 */
router.get('/:id/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const requestedPageSize = Number.parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10);
    const pageSize = requestedPageSize > 0 ? requestedPageSize : DEFAULT_PAGE_SIZE;

    const subscriptionRepo = AppDataSource.getRepository(WebhookSubscription);
    const exists = await subscriptionRepo.findOne({ where: { id } });
    if (!exists) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const deliveryRepo = AppDataSource.getRepository(WebhookDelivery);
    const [data, total] = await deliveryRepo.findAndCount({
      where: { subscriptionId: id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.json({ data, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/webhooks/:id/test
 *
 * TODO: Send a test webhook payload to a subscription
 *
 * Steps:
 *   1. Find the subscription by ID
 *   2. Create a test payload: { event: "test", orderId: 0, data: { message: "Test webhook delivery" }, timestamp: new Date().toISOString() }
 *   3. Sign and send it to the subscription URL (same logic as triggerWebhooks)
 *   4. Record the delivery
 *
 * Response: The WebhookDelivery record for the test
 * Error: 404 if subscription not found
 */
router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const subscriptionRepo = AppDataSource.getRepository(WebhookSubscription);
    const subscription = await subscriptionRepo.findOne({ where: { id } });
    if (!subscription) {
      res.status(404).json({ error: 'Webhook subscription not found' });
      return;
    }

    const payload = {
      event: 'test',
      orderId: 0,
      data: { message: 'Test webhook delivery' },
      timestamp: new Date().toISOString(),
    };
    const delivery = await sendAndRecordDelivery(subscription, payload, 1);
    res.status(201).json(delivery);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/webhooks/deliveries/:id/retry
 *
 * TODO: Retry a failed webhook delivery
 *
 * Uses the retryWebhookDelivery service function.
 *
 * Response: The new WebhookDelivery record
 * Error: 404 if delivery not found
 */
router.post('/deliveries/:id/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const delivery = await retryWebhookDelivery(id);
    res.status(201).json(delivery);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;
