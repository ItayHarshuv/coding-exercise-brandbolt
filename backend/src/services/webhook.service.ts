import { AppDataSource } from '../database';
import { WebhookSubscription } from '../entities/WebhookSubscription';
import { WebhookDelivery } from '../entities/WebhookDelivery';
import axios from 'axios';
import crypto from 'crypto';

type WebhookPayload = {
  event: string;
  orderId: number;
  data: Record<string, any>;
  timestamp: string;
};

function signPayload(payload: WebhookPayload, secret: string): string {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

async function sendAndRecordDelivery(
  subscription: WebhookSubscription,
  payload: WebhookPayload,
  attemptNumber: number
): Promise<WebhookDelivery> {
  const deliveryRepo = AppDataSource.getRepository(WebhookDelivery);
  const signature = signPayload(payload, subscription.secret);

  let statusCode: number | null = null;
  let responseBody: string | null = null;
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
      statusCode = error.response?.status ?? null;
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

  const delivery = deliveryRepo.create({
    subscriptionId: subscription.id,
    orderId: payload.orderId,
    event: payload.event,
    payload,
    statusCode,
    responseBody,
    success,
    attemptNumber,
    deliveredAt: new Date(),
  });

  return deliveryRepo.save(delivery);
}

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
  const subscriptionRepo = AppDataSource.getRepository(WebhookSubscription);
  const subscriptions = await subscriptionRepo
    .createQueryBuilder('subscription')
    .where('subscription.isActive = :isActive', { isActive: true })
    .andWhere('subscription.events LIKE :event', { event: `%${event}%` })
    .getMany();

  const matchingSubscriptions = subscriptions.filter((subscription) =>
    subscription.events.includes(event)
  );

  await Promise.all(
    matchingSubscriptions.map((subscription) =>
      sendAndRecordDelivery(
        subscription,
        {
          event,
          orderId,
          data: payload,
          timestamp: new Date().toISOString(),
        },
        1
      )
    )
  );
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
  const deliveryRepo = AppDataSource.getRepository(WebhookDelivery);

  const originalDelivery = await deliveryRepo.findOne({
    where: { id: deliveryId },
    relations: ['subscription'],
  });

  if (!originalDelivery) {
    throw new Error('Webhook delivery not found');
  }

  if (!originalDelivery.subscription) {
    throw new Error('Webhook subscription not found for delivery');
  }

  return sendAndRecordDelivery(
    originalDelivery.subscription,
    originalDelivery.payload as WebhookPayload,
    originalDelivery.attemptNumber + 1
  );
}
