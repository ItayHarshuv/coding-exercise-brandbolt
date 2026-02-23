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
import OrderCustomerSection from '../components/OrderCustomerSection';
import OrderInfoSection from '../components/OrderInfoSection';
import OrderLineItemsSection from '../components/OrderLineItemsSection';
import OrderNotesSection from '../components/OrderNotesSection';
import OrderStatusChangeSelect from '../components/OrderStatusChangeSelect';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import PageHeader from '../components/PageHeader';
import StatusChangeConfirmModal from '../components/StatusChangeConfirmModal';
import { Order, OrderStatus, STATUS_CLASS_MAP } from '../types';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
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
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsavedChanges]);

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    if (!order) return;

    setStatusLoading(true);
    setActionMessage(null);
    try {
      const response = await api.patch<Order>(`/orders/${order.id}/status`, { status: nextStatus });
      setOrder(response.data);
      setActionMessage({ type: 'success', text: `Status updated to ${nextStatus}` });
    } catch (requestError: any) {
      setActionMessage({ type: 'error', text: requestError?.response?.data?.error || 'Failed to update status' });
    } finally {
      setPendingStatus(null);
      setIsStatusConfirmOpen(false);
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

  if (loading) {
    return (
      <div>
        <PageHeader title={`Order #${id}`} />
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
        <PageHeader title={`Order #${id}`} />
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

      <PageHeader
        title={
          <>
            Order #{order.id}
            <span style={{ marginLeft: 12 }}>
              <span className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}>{order.status}</span>
            </span>
          </>
        }
        subtitle={`Created ${new Date(order.createdAt).toLocaleString()}`}
        actions={
          <OrderStatusChangeSelect
            options={availableTransitions}
            disabled={statusLoading}
            onSelect={(value) => {
              setPendingStatus(value);
              setIsStatusConfirmOpen(true);
            }}
          />
        }
      />

      {actionMessage && (
        <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {actionMessage.text}
        </div>
      )}

      <StatusChangeConfirmModal
        isOpen={isStatusConfirmOpen}
        title="Confirm Status Change"
        onClose={() => {
          setIsStatusConfirmOpen(false);
          setPendingStatus(null);
        }}
        onConfirm={() => (pendingStatus ? handleStatusChange(pendingStatus) : undefined)}
        loading={statusLoading}
      >
        <p className="text-secondary">
          Change order status from <span className="font-bold">{order.status}</span> to{' '}
          <span className="font-bold">{pendingStatus}</span>?
        </p>
      </StatusChangeConfirmModal>

      <OrderStatusTimeline currentStatus={order.status} />

      <div className="detail-grid">
        <OrderInfoSection
          status={order.status}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
          totalAmount={order.totalAmount}
        />
        <OrderCustomerSection
          name={order.customer.name}
          email={order.customer.email}
          phone={order.customer.phone}
        />
      </div>

      <OrderNotesSection
        isEditing={isEditing}
        notesDraft={notesDraft}
        originalNotes={order.notes}
        saveLoading={saveLoading}
        onEdit={() => setIsEditing(true)}
        onNotesChange={setNotesDraft}
        onSave={() => void handleSaveNotes()}
        onCancel={() => {
          setNotesDraft(order.notes ?? '');
          setIsEditing(false);
        }}
      />

      <OrderLineItemsSection items={order.items} subtotal={order.totalAmount} />
    </div>
  );
}
