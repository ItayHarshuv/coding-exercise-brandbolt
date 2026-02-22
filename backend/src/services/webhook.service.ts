import { AppDataSource } from '../database';
import { WebhookSubscription } from '../entities/WebhookSubscription';
import { WebhookDelivery } from '../entities/WebhookDelivery';

/**
 * Triggers webhooks for a given order event.
 *
 * TODO: Implement this function
 *
 * Steps:
 * 1. Find all active WebhookSubscriptions whose `events` array includes the given event
 * 2. For each matching subscription:
 *    a. Build the payload: { event, orderId, data: payload, timestamp: new Date().toISOString() }
 *    b. Compute an HMAC-SHA256 signature of the JSON payload using the subscription's `secret`
 *    c. Send an HTTP POST to the subscription's `url` with:
 *       - Header `Content-Type: application/json`
 *       - Header `X-Webhook-Signature: sha256=<hex-encoded HMAC>`
 *       - The JSON payload as the body
 *    d. Create a WebhookDelivery record with the result:
 *       - subscriptionId, orderId, event, payload
 *       - statusCode (from response or null if request failed)
 *       - responseBody (from response or error message)
 *       - success (true if status 2xx)
 *       - deliveredAt (current timestamp)
 *
 * @param orderId - The ID of the order that triggered the event
 * @param event - The event type string (e.g., "order.status.CONFIRMED")
 * @param payload - The data payload to send with the webhook
 */
export async function triggerWebhooks(
  orderId: number,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  // TODO: Implement webhook triggering logic
  // This is intentionally left for the candidate to implement.
  // See the JSDoc above for detailed implementation steps.

  const _subscriptionRepo = AppDataSource.getRepository(WebhookSubscription);
  const _deliveryRepo = AppDataSource.getRepository(WebhookDelivery);

  // Hint: You'll need these imports:
  // import axios from 'axios';
  // import crypto from 'crypto';

  console.log(`[Webhook] TODO: trigger webhooks for order ${orderId}, event: ${event}`);
}

/**
 * Retries a specific failed webhook delivery.
 *
 * TODO: Implement this function
 *
 * Steps:
 * 1. Fetch the WebhookDelivery by ID (with its subscription relation)
 * 2. Re-send the stored payload to the subscription's URL (same HMAC signing logic)
 * 3. Create a new WebhookDelivery record with attemptNumber incremented
 *
 * @param deliveryId - The ID of the failed delivery to retry
 * @returns The new WebhookDelivery record
 */
export async function retryWebhookDelivery(deliveryId: number): Promise<WebhookDelivery> {
  // TODO: Implement retry logic
  throw new Error('Not implemented: retryWebhookDelivery');
}
