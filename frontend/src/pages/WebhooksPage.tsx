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

import { FormEvent, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import PageRefreshControls from '../components/PageRefreshControls';
import { PaginatedResponse, WebhookDelivery, WebhookSubscription } from '../types';

const EVENT_OPTIONS = [
  'order.status.CONFIRMED',
  'order.status.PROCESSING',
  'order.status.SHIPPED',
  'order.status.DELIVERED',
  'order.status.CANCELLED',
];
const REFRESH_OPTIONS = [5, 10, 30];

type FormState = {
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
};

export default function WebhooksPage() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscription | null>(null);
  const [form, setForm] = useState<FormState>({
    url: '',
    secret: '',
    events: [],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deliveryData, setDeliveryData] = useState<Record<number, PaginatedResponse<WebhookDelivery>>>({});
  const [deliveryLoadingIds, setDeliveryLoadingIds] = useState<Set<number>>(new Set());
  const [deliveryPageBySubscription, setDeliveryPageBySubscription] = useState<Record<number, number>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const formTitle = useMemo(() => (editing ? 'Edit Subscription' : 'Add Subscription'), [editing]);

  const loadSubscriptions = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const response = await api.get<WebhookSubscription[]>('/webhooks');
      setSubscriptions(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Failed to load subscriptions');
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSubscriptions(true);
  }, []);

  const loadDeliveries = async (subscriptionId: number, page = 1) => {
    setDeliveryLoadingIds((previous) => new Set(previous).add(subscriptionId));
    try {
      const response = await api.get<PaginatedResponse<WebhookDelivery>>(
        `/webhooks/${subscriptionId}/deliveries`,
        { params: { page, pageSize: 10 } }
      );
      setDeliveryData((previous) => ({ ...previous, [subscriptionId]: response.data }));
      setDeliveryPageBySubscription((previous) => ({ ...previous, [subscriptionId]: page }));
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to load deliveries' });
    } finally {
      setDeliveryLoadingIds((previous) => {
        const next = new Set(previous);
        next.delete(subscriptionId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      void loadSubscriptions(false);
      for (const subscriptionId of expandedIds) {
        const page = deliveryPageBySubscription[subscriptionId] || 1;
        void loadDeliveries(subscriptionId, page);
      }
    }, refreshInterval * 1000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, refreshInterval, expandedIds, deliveryPageBySubscription]);

  const openCreate = () => {
    setEditing(null);
    setForm({ url: '', secret: '', events: [], isActive: true });
    setIsFormOpen(true);
  };

  const openEdit = (subscription: WebhookSubscription) => {
    setEditing(subscription);
    setForm({
      url: subscription.url,
      secret: subscription.secret,
      events: subscription.events,
      isActive: subscription.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editing) {
        await api.put(`/webhooks/${editing.id}`, form);
        setMessage({ type: 'success', text: 'Subscription updated' });
      } else {
        await api.post('/webhooks', form);
        setMessage({ type: 'success', text: 'Subscription created' });
      }
      setIsFormOpen(false);
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to save subscription' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (subscription: WebhookSubscription) => {
    setMessage(null);
    try {
      await api.put(`/webhooks/${subscription.id}`, { isActive: !subscription.isActive });
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to update subscription' });
    }
  };

  const deleteSubscription = async (subscription: WebhookSubscription) => {
    if (!window.confirm(`Delete subscription ${subscription.url}?`)) return;
    setMessage(null);
    try {
      await api.delete(`/webhooks/${subscription.id}`);
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to delete subscription' });
    }
  };

  const toggleExpanded = (subscriptionId: number) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(subscriptionId)) {
        next.delete(subscriptionId);
      } else {
        next.add(subscriptionId);
        void loadDeliveries(subscriptionId, deliveryPageBySubscription[subscriptionId] || 1);
      }
      return next;
    });
  };

  const sendTest = async (subscriptionId: number) => {
    setMessage(null);
    try {
      const response = await api.post<WebhookDelivery>(`/webhooks/${subscriptionId}/test`);
      setTestResult(response.data);
      if (expandedIds.has(subscriptionId)) {
        const page = deliveryPageBySubscription[subscriptionId] || 1;
        await loadDeliveries(subscriptionId, page);
      }
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to send test webhook' });
    }
  };

  const retryDelivery = async (subscriptionId: number, deliveryId: number) => {
    setMessage(null);
    try {
      await api.post(`/webhooks/deliveries/${deliveryId}/retry`);
      const page = deliveryPageBySubscription[subscriptionId] || 1;
      await loadDeliveries(subscriptionId, page);
    } catch (requestError: any) {
      setMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to retry delivery' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Webhooks</h1>
          <p className="page-subtitle">Manage webhook subscriptions and delivery logs</p>
        </div>
        <PageRefreshControls
          refreshing={refreshing}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          refreshOptions={REFRESH_OPTIONS}
          onRefresh={() => void loadSubscriptions(false)}
          refreshDisabled={refreshing}
        >
          
        </PageRefreshControls>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          + Add Subscription
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <span className="spinner"></span>
          Loading subscriptions...
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {subscriptions.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <p className="text-muted">No subscriptions yet. Create one to get started.</p>
            </div>
          )}
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="subscription-card">
              <div className="subscription-card-header">
                <span className="subscription-url">{subscription.url}</span>
                <span className={`badge ${subscription.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {subscription.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="subscription-actions">
                  <label className="toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={subscription.isActive}
                      onChange={() => void toggleActive(subscription)}
                    />
                    <span className="toggle-track"></span>
                  </label>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => openEdit(subscription)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => void deleteSubscription(subscription)}>
                    Delete
                  </button>
                  <button className="btn btn-accent btn-sm" type="button" onClick={() => void sendTest(subscription.id)}>
                    Test
                  </button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => toggleExpanded(subscription.id)}>
                    {expandedIds.has(subscription.id) ? 'Hide Log' : 'Show Log'}
                  </button>
                </div>
              </div>
              <div className="subscription-events">
                {subscription.events.map((eventName) => (
                  <span key={eventName} className="event-tag">{eventName}</span>
                ))}
              </div>

              {expandedIds.has(subscription.id) && (
                <div className="delivery-section">
                  <div className="delivery-section-header">
                    Delivery Log
                    {deliveryLoadingIds.has(subscription.id) && (
                      <span className="refreshing-indicator">
                        <span className="spinner"></span>
                        Loading
                      </span>
                    )}
                  </div>
                  {deliveryData[subscription.id] && (
                    <>
                      <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
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
                            {deliveryData[subscription.id].data.map((delivery) => (
                              <tr key={delivery.id}>
                                <td><span className="event-tag">{delivery.event}</span></td>
                                <td className="font-semibold">#{delivery.orderId}</td>
                                <td>{delivery.statusCode ?? 'N/A'}</td>
                                <td>
                                  <span className={`badge ${delivery.success ? 'badge-success' : 'badge-failure'}`}>
                                    {delivery.success ? 'Success' : 'Failed'}
                                  </span>
                                </td>
                                <td className="text-muted">
                                  {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : 'N/A'}
                                </td>
                                <td>{delivery.attemptNumber}</td>
                                <td>
                                  {!delivery.success && (
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      type="button"
                                      onClick={() => void retryDelivery(subscription.id, delivery.id)}
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
                          disabled={(deliveryPageBySubscription[subscription.id] || 1) <= 1}
                          onClick={() => void loadDeliveries(subscription.id, (deliveryPageBySubscription[subscription.id] || 1) - 1)}
                        >
                          Prev
                        </button>
                        <span>
                          Page {deliveryPageBySubscription[subscription.id] || 1} of{' '}
                          {Math.max(1, Math.ceil(deliveryData[subscription.id].total / deliveryData[subscription.id].pageSize))}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={
                            (deliveryPageBySubscription[subscription.id] || 1) >=
                            Math.max(1, Math.ceil(deliveryData[subscription.id].total / deliveryData[subscription.id].pageSize))
                          }
                          onClick={() => void loadDeliveries(subscription.id, (deliveryPageBySubscription[subscription.id] || 1) + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{formTitle}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setIsFormOpen(false)} disabled={saving}>
                &#10005;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">URL</label>
                  <input
                    className="form-input"
                    type="url"
                    value={form.url}
                    onChange={(event) => setForm((previous) => ({ ...previous, url: event.target.value }))}
                    placeholder="https://example.com/webhook"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Secret</label>
                  <input
                    className="form-input"
                    value={form.secret}
                    onChange={(event) => setForm((previous) => ({ ...previous, secret: event.target.value }))}
                    placeholder="Webhook signing secret"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Events</label>
                  <div className="form-checkbox-group">
                    {EVENT_OPTIONS.map((eventName) => (
                      <label
                        key={eventName}
                        className={`form-checkbox-label${form.events.includes(eventName) ? ' checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.events.includes(eventName)}
                          onChange={(event) =>
                            setForm((previous) => ({
                              ...previous,
                              events: event.target.checked
                                ? [...previous.events, eventName]
                                : previous.events.filter((current) => current !== eventName),
                            }))
                          }
                        />
                        {eventName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))}
                    />
                    <span className="toggle-track"></span>
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setIsFormOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {testResult && (
        <div className="modal-overlay" onClick={() => setTestResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Test Result</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setTestResult(null)}>
                &#10005;
              </button>
            </div>
            <div className="test-result-body">
              <div className="flex items-center gap-md">
                <span className={`badge ${testResult.success ? 'badge-success' : 'badge-failure'}`}>
                  {testResult.success ? 'Success' : 'Failed'}
                </span>
                <span className="text-secondary text-sm">
                  Status: {testResult.statusCode ?? 'N/A'}
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Event</label>
                <span className="event-tag">{testResult.event}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Response Body</label>
                <p className="text-secondary text-sm">{testResult.responseBody ?? 'N/A'}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Payload</label>
                <pre>{JSON.stringify(testResult.payload, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
