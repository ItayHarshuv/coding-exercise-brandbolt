/**
 * Order Detail Page
 *
 * TODO: Implement the order detail view with the following features:
 *
 * ORDER INFO DISPLAY:
 * - Order ID, status (colored badge), dates (created, updated)
 * - Customer info (name, email, phone)
 * - Order notes
 * - Total amount
 *
 * STATUS MANAGEMENT:
 * - Status change dropdown showing only valid transitions:
 *   PENDING -> CONFIRMED, CANCELLED
 *   CONFIRMED -> PROCESSING, CANCELLED
 *   PROCESSING -> SHIPPED, CANCELLED
 *   SHIPPED -> DELIVERED
 *   DELIVERED -> (terminal)
 *   CANCELLED -> (terminal)
 * - Confirmation modal before status change ("Are you sure you want to change status from X to Y?")
 * - Calls PATCH /api/orders/:id/status
 * - Shows success/error feedback
 *
 * STATUS TIMELINE:
 * - Visual timeline/history showing order status progression
 * - Highlight the current status
 * - Show which statuses have been passed through
 *
 * LINE ITEMS TABLE:
 * - Columns: Product Name, SKU, Unit Price, Quantity, Line Total
 * - Subtotal row at bottom
 *
 * EDIT MODE:
 * - Toggle button to switch between view and edit mode
 * - In edit mode: notes field becomes editable
 * - Save/Cancel buttons appear in edit mode
 * - Calls PATCH /api/orders/:id to save changes
 *
 * UNSAVED CHANGES:
 * - Track if user has made changes in edit mode
 * - Show warning/confirmation when navigating away with unsaved changes
 *   (use beforeunload event and/or React Router's useBlocker/prompt)
 *
 * LOADING & ERROR STATES:
 * - Loading skeleton/spinner while fetching
 * - Error display if order not found (404)
 * - Back button/link to return to orders list
 */

import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Order, OrderStatus } from '../types';

const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const STATUS_CLASS_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: 'pending',
  [OrderStatus.CONFIRMED]: 'confirmed',
  [OrderStatus.PROCESSING]: 'processing',
  [OrderStatus.SHIPPED]: 'shipped',
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.CANCELLED]: 'cancelled',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const unsavedChanges = isEditing && order && notesDraft !== (order.notes ?? '');

  const availableTransitions = useMemo(() => {
    if (!order) return [] as OrderStatus[];
    return STATUS_TRANSITIONS[order.status];
  }, [order]);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Order>(`/orders/${id}`);
      setOrder(response.data);
      setNotesDraft(response.data.notes ?? '');
    } catch (requestError: any) {
      if (requestError?.response?.status === 404) {
        setError('Order not found');
      } else {
        setError(requestError?.response?.data?.error || 'Failed to load order');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!unsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsavedChanges]);

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    if (!order) return;
    const confirmed = window.confirm(
      `Are you sure you want to change status from ${order.status} to ${nextStatus}?`
    );
    if (!confirmed) return;

    setStatusLoading(true);
    setActionMessage(null);
    try {
      const response = await api.patch<Order>(`/orders/${order.id}/status`, { status: nextStatus });
      setOrder(response.data);
      setActionMessage({ type: 'success', text: `Status updated to ${nextStatus}` });
    } catch (requestError: any) {
      setActionMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to update status' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!order) return;
    setSaveLoading(true);
    setActionMessage(null);
    try {
      const response = await api.patch<Order>(`/orders/${order.id}`, { notes: notesDraft });
      setOrder(response.data);
      setIsEditing(false);
      setActionMessage({ type: 'success', text: 'Order updated' });
    } catch (requestError: any) {
      setActionMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to save notes' });
    } finally {
      setSaveLoading(false);
    }
  };

  const timelineProgress = (status: OrderStatus) => {
    if (!order) return 'pending';
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const itemIndex = STATUS_FLOW.indexOf(status);
    if (status === order.status) return 'current';
    if (itemIndex <= currentIndex && order.status !== OrderStatus.CANCELLED) return 'passed';
    if (status === OrderStatus.CANCELLED && order.status === OrderStatus.CANCELLED) return 'passed';
    return 'pending';
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Order #{id}</h1>
          </div>
        </div>
        <div className="loading-container">
          <span className="spinner"></span>
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Order #{id}</h1>
          </div>
        </div>
        <div className="alert alert-error">{error || 'Order not found'}</div>
        <Link to="/orders" className="detail-back">&larr; Back to Orders</Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/orders"
        className="detail-back"
        onClick={(event) => {
          if (!unsavedChanges) return;
          const proceed = window.confirm('You have unsaved changes. Leave this page?');
          if (!proceed) event.preventDefault();
        }}
      >
        &larr; Back to Orders
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Order #{order.id}
            <span style={{ marginLeft: 12 }}>
              <span className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}>{order.status}</span>
            </span>
          </h1>
          <p className="page-subtitle">Created {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="page-header-actions">
          {availableTransitions.length > 0 && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 180 }}
              defaultValue=""
              onChange={(event) => {
                const value = event.target.value as OrderStatus | '';
                if (!value) return;
                void handleStatusChange(value);
                event.target.value = '';
              }}
              disabled={statusLoading}
            >
              <option value="">Change status...</option>
              {availableTransitions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="detail-section mb-lg">
        <div className="detail-section-title">Status Timeline</div>
        <div className="timeline">
          {STATUS_FLOW.map((statusStep) => (
            <div key={statusStep} className={`timeline-step ${timelineProgress(statusStep)}`}>
              <div className="timeline-dot">
                {timelineProgress(statusStep) === 'passed' ? '\u2713' : ''}
              </div>
              <span className="timeline-label">{statusStep}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <div className="detail-section-title">Order Info</div>
          <div className="detail-field">
            <span className="detail-field-label">Status</span>
            <span className="detail-field-value">
              <span className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}>{order.status}</span>
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Created</span>
            <span className="detail-field-value">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Updated</span>
            <span className="detail-field-value">{new Date(order.updatedAt).toLocaleString()}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Total</span>
            <span className="detail-field-value large">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Customer</div>
          <div className="detail-field">
            <span className="detail-field-label">Name</span>
            <span className="detail-field-value">{order.customer.name}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Email</span>
            <span className="detail-field-value">{order.customer.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Phone</span>
            <span className="detail-field-value">{order.customer.phone || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section mb-lg">
        <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Notes
          {!isEditing && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-md">
            <textarea
              className="form-textarea"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={4}
            />
            <div className="flex gap-sm">
              <button className="btn btn-primary btn-sm" type="button" onClick={() => void handleSaveNotes()} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => {
                  setNotesDraft(order.notes ?? '');
                  setIsEditing(false);
                }}
                disabled={saveLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-secondary">{order.notes || 'No notes'}</p>
        )}
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Line Items</div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.product.name}</td>
                  <td><span className="text-mono text-xs">{item.product.sku}</span></td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td className="font-semibold" style={{ color: 'var(--color-text)' }}>${Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="table-subtotal">
                <td colSpan={4}>Subtotal</td>
                <td>${Number(order.totalAmount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
