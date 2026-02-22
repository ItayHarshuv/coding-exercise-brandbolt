/**
 * Webhooks Page
 *
 * TODO: Implement the webhooks management page with the following features:
 *
 * SUBSCRIPTION LIST:
 * - Table/list of webhook subscriptions
 * - Columns: URL, Events (tags/badges), Status (active/inactive toggle), Actions
 * - Toggle switch to activate/deactivate subscriptions (calls PUT /api/webhooks/:id)
 *
 * CREATE/EDIT FORM:
 * - "Add Subscription" button opens a form (modal or inline)
 * - Fields:
 *   - URL input (required, validated as URL format)
 *   - Secret input (required)
 *   - Events: multi-select checkboxes for event types:
 *     "order.status.CONFIRMED", "order.status.PROCESSING",
 *     "order.status.SHIPPED", "order.status.DELIVERED", "order.status.CANCELLED"
 *   - Active toggle
 * - Edit existing subscriptions (pre-populate form)
 * - Delete subscription with confirmation
 *
 * DELIVERY LOG (per subscription):
 * - Expandable section or separate panel per subscription
 * - Table columns: Event, Order ID, Status Code, Success (icon), Timestamp, Attempt #
 * - Paginated (GET /api/webhooks/:id/deliveries)
 * - Color-coded: green for success, red for failure
 *
 * TEST BUTTON:
 * - Button on each subscription to send a test webhook
 * - Calls POST /api/webhooks/:id/test
 * - Shows result in a modal: request payload, response status, response body
 *
 * RETRY BUTTON:
 * - On failed deliveries, show a "Retry" button
 * - Calls POST /api/webhooks/deliveries/:id/retry
 * - Updates the delivery log after retry
 *
 * AUTO-REFRESH:
 * - Toggle to enable/disable auto-refresh of delivery logs
 * - When enabled, polls delivery logs every few seconds
 */

export default function WebhooksPage() {
  return (
    <div>
      <h1>Webhooks</h1>
      <p>TODO: Implement webhook subscription management with delivery logs.</p>
    </div>
  );
}
