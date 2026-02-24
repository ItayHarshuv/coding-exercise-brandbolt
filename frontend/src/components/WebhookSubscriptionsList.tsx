import {
  PaginatedResponse,
  WebhookDelivery,
  WebhookSubscription,
} from "../types";

type WebhookSubscriptionsListProps = {
  loading: boolean;
  subscriptions: WebhookSubscription[];
  expandedIds: Set<number>;
  deliveryData: Record<number, PaginatedResponse<WebhookDelivery>>;
  deliveryLoadingIds: Set<number>;
  deliveryPageBySubscription: Record<number, number>;
  onToggleActive: (subscription: WebhookSubscription) => void;
  onEdit: (subscription: WebhookSubscription) => void;
  onDelete: (subscription: WebhookSubscription) => void;
  onSendTest: (subscriptionId: number) => void;
  onToggleExpanded: (subscriptionId: number) => void;
  onRetryDelivery: (subscriptionId: number, deliveryId: number) => void;
  onLoadDeliveriesPage: (subscriptionId: number, page: number) => void;
};

export default function WebhookSubscriptionsList({
  loading,
  subscriptions,
  expandedIds,
  deliveryData,
  deliveryLoadingIds,
  deliveryPageBySubscription,
  onToggleActive,
  onEdit,
  onDelete,
  onSendTest,
  onToggleExpanded,
  onRetryDelivery,
  onLoadDeliveriesPage,
}: WebhookSubscriptionsListProps) {
  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner"></span>
        Loading subscriptions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {subscriptions.length === 0 && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "var(--space-2xl)" }}
        >
          <p className="text-muted">
            No subscriptions yet. Create one to get started.
          </p>
        </div>
      )}
      {subscriptions.map((subscription) => {
        const isExpanded = expandedIds.has(subscription.id);
        const deliveryPage = deliveryPageBySubscription[subscription.id] || 1;
        const subscriptionDeliveryData = deliveryData[subscription.id];
        const totalDeliveryPages = subscriptionDeliveryData
          ? Math.max(
              1,
              Math.ceil(
                subscriptionDeliveryData.total /
                  subscriptionDeliveryData.pageSize,
              ),
            )
          : 1;

        return (
          <div key={subscription.id} className="subscription-card">
            <div className="subscription-card-header">
              <span className="subscription-url">{subscription.url}</span>
              <span
                className={`badge ${subscription.isActive ? "badge-active" : "badge-inactive"}`}
              >
                {subscription.isActive ? "Active" : "Inactive"}
              </span>
              <div className="subscription-actions">
                <label className="toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={subscription.isActive}
                    onChange={() => onToggleActive(subscription)}
                  />
                  <span className="toggle-track"></span>
                </label>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => onEdit(subscription)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  type="button"
                  onClick={() => onDelete(subscription)}
                >
                  Delete
                </button>
                <button
                  className="btn btn-accent btn-sm"
                  type="button"
                  onClick={() => onSendTest(subscription.id)}
                >
                  Test
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => onToggleExpanded(subscription.id)}
                >
                  {isExpanded ? "Hide Log" : "Show Log"}
                </button>
              </div>
            </div>
            <div className="subscription-events">
              {subscription.events.map((eventName) => (
                <span key={eventName} className="event-tag">
                  {eventName}
                </span>
              ))}
            </div>

            {isExpanded && (
              <div className="delivery-section">
                {subscriptionDeliveryData && (
                  <>
                    <div
                      className="table-wrapper"
                      style={{ border: "none", borderRadius: 0 }}
                    >
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Order ID</th>
                            <th>Status Code</th>
                            <th>Result</th>
                            <th>Timestamp</th>
                            <th>Attempt</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptionDeliveryData.data.map((delivery) => (
                            <tr key={delivery.id}>
                              <td>
                                <span className="event-tag">
                                  {delivery.event}
                                </span>
                              </td>
                              <td className="font-semibold">
                                #{delivery.orderId}
                              </td>
                              <td>{delivery.statusCode ?? "N/A"}</td>
                              <td>
                                <span
                                  className={`badge ${delivery.success ? "badge-success" : "badge-failure"}`}
                                >
                                  {delivery.success ? "Success" : "Failed"}
                                </span>
                              </td>
                              <td className="text-muted">
                                {delivery.deliveredAt
                                  ? new Date(
                                      delivery.deliveredAt,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>{delivery.attemptNumber}</td>
                              <td>
                                {!delivery.success && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    type="button"
                                    onClick={() =>
                                      onRetryDelivery(
                                        subscription.id,
                                        delivery.id,
                                      )
                                    }
                                  >
                                    Retry
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="delivery-pagination">
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={deliveryPage <= 1}
                        onClick={() =>
                          onLoadDeliveriesPage(
                            subscription.id,
                            deliveryPage - 1,
                          )
                        }
                      >
                        Prev
                      </button>
                      <span>
                        Page {deliveryPage} of {totalDeliveryPages}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={deliveryPage >= totalDeliveryPages}
                        onClick={() =>
                          onLoadDeliveriesPage(
                            subscription.id,
                            deliveryPage + 1,
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
