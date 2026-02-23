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

import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import PageRefreshControls from "../components/PageRefreshControls";
import WebhookSubscriptionFormModal, {
  WebhookFormState,
} from "../components/WebhookSubscriptionFormModal";
import WebhookSubscriptionsList from "../components/WebhookSubscriptionsList";
import WebhookTestResultModal from "../components/WebhookTestResultModal";
import {
  PaginatedResponse,
  WebhookDelivery,
  WebhookSubscription,
} from "../types";

const EVENT_OPTIONS = [
  "order.status.CONFIRMED",
  "order.status.PROCESSING",
  "order.status.SHIPPED",
  "order.status.DELIVERED",
  "order.status.CANCELLED",
];
const REFRESH_OPTIONS = [5, 10, 30];

export default function WebhooksPage() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscription | null>(null);
  const [form, setForm] = useState<WebhookFormState>({
    url: "",
    secret: "",
    events: [],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deliveryData, setDeliveryData] = useState<
    Record<number, PaginatedResponse<WebhookDelivery>>
  >({});
  const [deliveryLoadingIds, setDeliveryLoadingIds] = useState<Set<number>>(
    new Set(),
  );
  const [deliveryPageBySubscription, setDeliveryPageBySubscription] = useState<
    Record<number, number>
  >({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const formTitle = useMemo(
    () => (editing ? "Edit Subscription" : "Add Subscription"),
    [editing],
  );

  const loadSubscriptions = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const response = await api.get<WebhookSubscription[]>("/webhooks");
      setSubscriptions(response.data);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error || "Failed to load subscriptions",
      );
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
        { params: { page, pageSize: 10 } },
      );
      setDeliveryData((previous) => ({
        ...previous,
        [subscriptionId]: response.data,
      }));
      setDeliveryPageBySubscription((previous) => ({
        ...previous,
        [subscriptionId]: page,
      }));
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text:
          requestError?.response?.data?.error || "Failed to load deliveries",
      });
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
    setForm({ url: "", secret: "", events: [], isActive: true });
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
        setMessage({ type: "success", text: "Subscription updated" });
      } else {
        await api.post("/webhooks", form);
        setMessage({ type: "success", text: "Subscription created" });
      }
      setIsFormOpen(false);
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text:
          requestError?.response?.data?.error || "Failed to save subscription",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (subscription: WebhookSubscription) => {
    setMessage(null);
    try {
      await api.put(`/webhooks/${subscription.id}`, {
        isActive: !subscription.isActive,
      });
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text:
          requestError?.response?.data?.error ||
          "Failed to update subscription",
      });
    }
  };

  const deleteSubscription = async (subscription: WebhookSubscription) => {
    if (!window.confirm(`Delete subscription ${subscription.url}?`)) return;
    setMessage(null);
    try {
      await api.delete(`/webhooks/${subscription.id}`);
      await loadSubscriptions(false);
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text:
          requestError?.response?.data?.error ||
          "Failed to delete subscription",
      });
    }
  };

  const toggleExpanded = (subscriptionId: number) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(subscriptionId)) {
        next.delete(subscriptionId);
      } else {
        next.add(subscriptionId);
        void loadDeliveries(
          subscriptionId,
          deliveryPageBySubscription[subscriptionId] || 1,
        );
      }
      return next;
    });
  };

  const sendTest = async (subscriptionId: number) => {
    setMessage(null);
    try {
      const response = await api.post<WebhookDelivery>(
        `/webhooks/${subscriptionId}/test`,
      );
      setTestResult(response.data);
      if (expandedIds.has(subscriptionId)) {
        const page = deliveryPageBySubscription[subscriptionId] || 1;
        await loadDeliveries(subscriptionId, page);
      }
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text:
          requestError?.response?.data?.error || "Failed to send test webhook",
      });
    }
  };

  const retryDelivery = async (subscriptionId: number, deliveryId: number) => {
    setMessage(null);
    try {
      await api.post(`/webhooks/deliveries/${deliveryId}/retry`);
      const page = deliveryPageBySubscription[subscriptionId] || 1;
      await loadDeliveries(subscriptionId, page);
    } catch (requestError: any) {
      setMessage({
        type: "error",
        text: requestError?.response?.data?.error || "Failed to retry delivery",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Manage webhook subscriptions and delivery logs"
        actions={
          <>
            <PageRefreshControls
              refreshing={refreshing}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              refreshOptions={REFRESH_OPTIONS}
              onRefresh={() => void loadSubscriptions(false)}
              refreshDisabled={refreshing}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={openCreate}
            >
              + Add Subscription
            </button>
          </>
        }
      />

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <WebhookSubscriptionsList
        loading={loading}
        subscriptions={subscriptions}
        expandedIds={expandedIds}
        deliveryData={deliveryData}
        deliveryLoadingIds={deliveryLoadingIds}
        deliveryPageBySubscription={deliveryPageBySubscription}
        onToggleActive={(subscription) => void toggleActive(subscription)}
        onEdit={openEdit}
        onDelete={(subscription) => void deleteSubscription(subscription)}
        onSendTest={(subscriptionId) => void sendTest(subscriptionId)}
        onToggleExpanded={toggleExpanded}
        onRetryDelivery={(subscriptionId, deliveryId) =>
          void retryDelivery(subscriptionId, deliveryId)
        }
        onLoadDeliveriesPage={(subscriptionId, page) =>
          void loadDeliveries(subscriptionId, page)
        }
      />

      <WebhookSubscriptionFormModal
        isOpen={isFormOpen}
        title={formTitle}
        form={form}
        eventOptions={EVENT_OPTIONS}
        saving={saving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        onFormChange={setForm}
      />

      <WebhookTestResultModal
        result={testResult}
        onClose={() => setTestResult(null)}
      />
    </div>
  );
}
