import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database';
import { WebhookSubscription } from '../entities/WebhookSubscription';
import { WebhookDelivery } from '../entities/WebhookDelivery';
import { retryWebhookDelivery } from '../services/webhook.service';

const router = Router();

/**
 * GET /api/webhooks
 *
 * TODO: List all webhook subscriptions
 *
 * Response: Array of WebhookSubscription objects
 */
router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement listing webhook subscriptions
  res.status(501).json({ error: 'Not implemented: GET /api/webhooks' });
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
router.post('/', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement creating a webhook subscription
  res.status(501).json({ error: 'Not implemented: POST /api/webhooks' });
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
router.put('/:id', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement updating a webhook subscription
  res.status(501).json({ error: 'Not implemented: PUT /api/webhooks/:id' });
});

/**
 * DELETE /api/webhooks/:id
 *
 * TODO: Delete a webhook subscription
 *
 * Response: 204 No Content
 * Error: 404 if not found
 */
router.delete('/:id', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement deleting a webhook subscription
  res.status(501).json({ error: 'Not implemented: DELETE /api/webhooks/:id' });
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
router.get('/:id/deliveries', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement delivery log listing
  res.status(501).json({ error: 'Not implemented: GET /api/webhooks/:id/deliveries' });
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
router.post('/:id/test', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement test webhook delivery
  res.status(501).json({ error: 'Not implemented: POST /api/webhooks/:id/test' });
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
router.post('/deliveries/:id/retry', async (_req: Request, res: Response, _next: NextFunction) => {
  // TODO: Implement delivery retry
  res.status(501).json({ error: 'Not implemented: POST /api/webhooks/deliveries/:id/retry' });
});

export default router;
