/**
 * Orders Page
 *
 * TODO: Implement the orders list page with the following features:
 *
 * DATA TABLE:
 * - Columns: ID, Customer Name, Status (colored badge), Total Amount, Date
 * - Row click navigates to order detail page
 *
 * FILTERING:
 * - Multi-select status filter dropdown (filter by one or more OrderStatus values)
 * - Text search input (debounced, ~300ms) that searches by customer name
 * - All filter values synced to URL search params (so filters persist on refresh)
 *
 * SORTING:
 * - Clickable column headers to sort
 * - Toggle between ASC/DESC on repeated clicks
 * - Sort state synced to URL search params
 *
 * PAGINATION:
 * - Page navigation (previous/next, page numbers)
 * - Page size selector (10 / 25 / 50)
 * - Display "Showing X-Y of Z" text
 * - Page/pageSize synced to URL search params
 *
 * BULK OPERATIONS:
 * - Checkbox on each row for selection
 * - "Select all on page" checkbox in header
 * - When items selected, show bulk action bar with:
 *   - Count of selected items
 *   - Status dropdown to pick target status
 *   - "Update Status" button that opens confirmation modal
 *   - Executes POST /api/orders/bulk-status
 *
 * CREATION:
 * - "New Order" button that opens an order creation form (modal or separate route)
 * - See CreateOrderForm description below
 *
 * ORDER CREATION FORM (modal or inline):
 * - Customer selector: searchable dropdown populated from GET /api/customers
 * - Line items section:
 *   - Each row: product selector (searchable), quantity input, calculated line total
 *   - "Add Item" button to add another line
 *   - Remove button on each line item
 *   - Running total displayed
 * - Notes textarea (optional)
 * - Form validation:
 *   - Customer is required
 *   - At least one line item
 *   - Quantity must be positive integer
 *   - Quantity must not exceed product stock
 * - Submit button with loading state
 * - Error display for server-side errors
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import StatusChangeConfirmModal from '../components/StatusChangeConfirmModal';
import {
  BulkStatusResult,
  CreateOrderRequest,
  Customer,
  Order,
  OrderStatus,
  PaginatedResponse,
  Product,
} from '../types';

const PAGE_SIZES = [10, 25, 50];
const STATUS_OPTIONS = Object.values(OrderStatus);

const STATUS_CLASS_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: 'pending',
  [OrderStatus.CONFIRMED]: 'confirmed',
  [OrderStatus.PROCESSING]: 'processing',
  [OrderStatus.SHIPPED]: 'shipped',
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.CANCELLED]: 'cancelled',
};

type SortableColumn = 'id' | 'status' | 'totalAmount' | 'createdAt';
type OrderCreateLine = { productId: number | null; quantity: number};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ordersRefreshNonce, setOrdersRefreshNonce] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [newOrderCustomerId, setNewOrderCustomerId] = useState<number | null>(null);
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<OrderCreateLine[]>([
    { productId: null, quantity: 1},
  ]);

  const statuses = useMemo(() => {
    const raw = searchParams.get('status');
    if (!raw) return [] as OrderStatus[];
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is OrderStatus => STATUS_OPTIONS.includes(value as OrderStatus));
  }, [searchParams]);
  const sortBy = (searchParams.get('sortBy') || 'createdAt') as SortableColumn;
  const sortDir = searchParams.get('sortDir') === 'ASC' ? 'ASC' : 'DESC';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = PAGE_SIZES.includes(Number(searchParams.get('pageSize')))
    ? Number(searchParams.get('pageSize'))
    : 10;
  const search = searchParams.get('search') || '';
  const [searchDraft, setSearchDraft] = useState(search);

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchDraft === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchDraft.trim()) next.set('search', searchDraft.trim());
      else next.delete('search');
      next.set('page', '1');
      setSearchParams(next);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchDraft, search, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.get<PaginatedResponse<Order>>('/orders', {
          params: {
            status: statuses.length ? statuses.join(',') : undefined,
            search: search || undefined,
            sortBy,
            sortDir,
            page,
            pageSize,
          },
        });
        setOrders(response.data.data);
        setTotal(response.data.total);
        setSelectedIds((previous) => {
          const idsInData = new Set(response.data.data.map((order) => order.id));
          return new Set([...previous].filter((id) => idsInData.has(id)));
        });
      } catch (error: any) {
        setLoadError(error?.response?.data?.error || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    void fetchOrders();
  }, [statuses, search, sortBy, sortDir, page, pageSize, ordersRefreshNonce]);

  useEffect(() => {
    if (!isCreateOpen || (customers.length > 0 && products.length > 0)) return;
    const fetchReferences = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          api.get<Customer[]>('/customers'),
          api.get<Product[]>('/products'),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
      } catch (error: any) {
        setCreateError(error?.response?.data?.error || 'Failed to load customers/products');
      }
    };
    void fetchReferences();
  }, [isCreateOpen, customers.length, products.length]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  const visibleCustomerOptions = useMemo(
    () =>
      customers.filter((customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase())
      ),
    [customers, customerSearch]
  );
  const visibleProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    if (!isCreateOpen) return;
    const timeout = window.setTimeout(() => {
      if (!customerSearch.trim()) {
        setNewOrderCustomerId(null);
        return;
      }
      setNewOrderCustomerId(visibleCustomerOptions[0]?.id ?? null);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [customerSearch, isCreateOpen, visibleCustomerOptions]);

  const runningTotal = newOrderItems.reduce((acc, item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next);
  };

  const toggleStatus = (status: OrderStatus) => {
    const nextStatuses = statuses.includes(status)
      ? statuses.filter((current) => current !== status)
      : [...statuses, status];
    updateParams({
      status: nextStatuses.length ? nextStatuses.join(',') : null,
      page: '1',
    });
  };

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      updateParams({ sortDir: sortDir === 'ASC' ? 'DESC' : 'ASC', page: '1' });
    } else {
      updateParams({ sortBy: column, sortDir: 'ASC', page: '1' });
    }
  };

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      for (const order of orders) {
        if (checked) next.add(order.id);
        else next.delete(order.id);
      }
      return next;
    });
  };

  const handleBulkUpdate = () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkConfirmOpen(true);
  };

  const confirmBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkConfirmOpen(false);
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const response = await api.post<BulkStatusResult>('/orders/bulk-status', {
        orderIds: Array.from(selectedIds),
        status: bulkStatus,
      });
      const { succeeded, failed } = response.data;
      setSelectedIds(new Set());
      setBulkStatus('');
      const summary = `Updated ${succeeded.length} orders, ${failed.length} failed.`;
      const successDetails = succeeded.map((id) => `#${id}`).join('\n');
      const failedDetails = failed.map(({ id, reason }) => `#${id}: ${reason}`).join('\n');

      const sections = [summary];
      if (succeeded.length > 0) {
        sections.push(`Updated orders:\n${successDetails}`);
      }
      if (failed.length > 0) {
        sections.push(`Failed details:\n${failedDetails}`);
      }
      setBulkMessage(sections.join('\n\n'));
      setOrdersRefreshNonce((previous) => previous + 1);
    } catch (error: any) {
      setBulkMessage(error?.response?.data?.error || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewOrderCustomerId(null);
    setNewOrderNotes('');
    setNewOrderItems([{ productId: null, quantity: 1}]);
    setCreateError(null);
    setCustomerSearch('');
    setProductSearch('');
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const validateCreateForm = (): string | null => {
    if (!newOrderCustomerId) return 'Customer is required';
    if (newOrderItems.length === 0) return 'At least one line item is required';
    for (const item of newOrderItems) {
      if (!item.productId) return 'Every line must include a product';
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) return 'Quantity must be a positive integer';
      const product = products.find((productEntry) => productEntry.id === item.productId);
      if (!product) return 'One or more selected products are invalid';
      if (item.quantity > product.stockQuantity) {
        return `Quantity for ${product.name} cannot exceed available stock (${product.stockQuantity})`;
      }
    }
    return null;
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    const validationError = validateCreateForm();
    if (validationError) {
      setCreateError(validationError);
      return;
    }
    const payload: CreateOrderRequest = {
      customerId: newOrderCustomerId!,
      items: newOrderItems.map((item) => ({ productId: item.productId!, quantity: item.quantity })),
      notes: newOrderNotes.trim() || undefined,
    };
    setCreateLoading(true);
    try {
      await api.post('/orders', payload);
      closeCreate();
      setOrdersRefreshNonce((previous) => previous + 1);
    } catch (error: any) {
      setCreateError(error?.response?.data?.error || 'Failed to create order');
    } finally {
      setCreateLoading(false);
    }
  };

  const allOnPageSelected = orders.length > 0 && orders.every((order) => selectedIds.has(order.id));

  const sortIndicator = (col: SortableColumn) => {
    if (sortBy !== col) return '';
    return sortDir === 'ASC' ? ' \u2191' : ' \u2193';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage and track all customer orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" type="button" onClick={() => setIsCreateOpen(true)}>
            + New Order
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filters-row">
          <input
            className="form-input"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by customer name..."
          />
          <div className="form-checkbox-group">
            {STATUS_OPTIONS.map((status) => (
              <label
                key={status}
                className={`form-checkbox-label${statuses.includes(status) ? ' checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selectedIds.size}</span>
          <span className="text-secondary">selected</span>
          <select
            className="form-select"
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as OrderStatus | '')}
          >
            <option value="">Select status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            className="btn btn-accent btn-sm"
            type="button"
            disabled={!bulkStatus || bulkLoading}
            onClick={() => void handleBulkUpdate()}
          >
            {bulkLoading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      )}
      {bulkMessage && <div className="alert alert-info">{bulkMessage}</div>}

      {loadError && <div className="alert alert-error">{loadError}</div>}

      <StatusChangeConfirmModal
        isOpen={isBulkConfirmOpen}
        title="Confirm Bulk Update"
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={confirmBulkUpdate}
        loading={bulkLoading}
      >
        <p className="text-secondary">
          Update <span className="font-bold">{selectedIds.size}</span> selected orders to{' '}
          <span className="font-bold">{bulkStatus}</span>?
        </p>
      </StatusChangeConfirmModal>

      {loading ? (
        <div className="loading-container">
          <span className="spinner"></span>
          Loading orders...
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(event) => toggleSelectAllOnPage(event.target.checked)}
                  />
                </th>
                <th>
                  <button
                    type="button"
                    className={`sort-btn${sortBy === 'id' ? ' active' : ''}`}
                    onClick={() => handleSort('id')}
                  >
                    ID{sortIndicator('id')}
                  </button>
                </th>
                <th>Customer</th>
                <th>
                  <button
                    type="button"
                    className={`sort-btn${sortBy === 'status' ? ' active' : ''}`}
                    onClick={() => handleSort('status')}
                  >
                    Status{sortIndicator('status')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`sort-btn${sortBy === 'totalAmount' ? ' active' : ''}`}
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total{sortIndicator('totalAmount')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`sort-btn${sortBy === 'createdAt' ? ' active' : ''}`}
                    onClick={() => handleSort('createdAt')}
                  >
                    Date{sortIndicator('createdAt')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                  <td onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={(event) => {
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          if (event.target.checked) next.add(order.id);
                          else next.delete(order.id);
                          return next;
                        });
                      }}
                    />
                  </td>
                  <td className="font-semibold">#{order.id}</td>
                  <td>{order.customer.name}</td>
                  <td>
                    <span className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="font-semibold">${Number(order.totalAmount).toFixed(2)}</td>
                  <td className="text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {pageStart}–{pageEnd} of {total}
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                type="button"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`pagination-btn${pageNumber === page ? ' active' : ''}`}
                  disabled={pageNumber === page}
                  onClick={() => updateParams({ page: String(pageNumber) })}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className="pagination-btn"
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
            <div className="pagination-size">
              <span>Rows:</span>
              <select
                className="form-select"
                value={pageSize}
                onChange={(event) => updateParams({ pageSize: event.target.value, page: '1' })}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="modal-overlay" onClick={closeCreate}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Order</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeCreate} disabled={createLoading}>
                &#10005;
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <input
                    className="form-input"
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Search customers..."
                  />
                  <select
                    className="form-select"
                    value={newOrderCustomerId ?? ''}
                    onChange={(event) => setNewOrderCustomerId(Number(event.target.value))}
                    required
                  >
                    <option value="">Select customer</option>
                    {visibleCustomerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Items</label>
                  {/* <input
                    className="form-input"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search products..."
                  /> */}
                  {newOrderItems.map((item, index) => {
                    const selectedProduct = products.find((product) => product.id === item.productId);
                    const lineTotal = selectedProduct ? selectedProduct.price * item.quantity : 0;
                    return (
                      <div key={index} className="line-item-row">
                        <select
                          className="form-select"
                          value={item.productId ?? ''}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setNewOrderItems((previous) =>
                              previous.map((line, lineIndex) =>
                                lineIndex === index ? { ...line, productId: Number.isNaN(value) ? null : value } : line
                              )
                            );
                          }}
                          required
                        >
                          <option value="">Select product</option>
                          {visibleProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku}) — ${Number(product.price).toFixed(2)} — stock: {product.stockQuantity}
                            </option>
                          ))}
                        </select>
                        <input
                          className="form-input"
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={(event) => {
                            const quantity = Number.parseInt(event.target.value, 10);
                            setNewOrderItems((previous) =>
                              previous.map((line, lineIndex) =>
                                lineIndex === index ? { ...line, quantity: Number.isNaN(quantity) ? 1 : quantity } : line
                              )
                            );
                          }}
                        />
                        <span className="line-total">${lineTotal.toFixed(2)}</span>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() =>
                            setNewOrderItems((previous) => previous.filter((_, lineIndex) => lineIndex !== index))
                          }
                          disabled={newOrderItems.length <= 1}
                        >
                          &#10005;
                        </button>
                      </div>
                    );
                  })}
                  <button
                    className="btn btn-ghost btn-sm mt-sm"
                    type="button"
                    onClick={() =>
                      setNewOrderItems((previous) => [...previous, { productId: null, quantity: 1, productSearch: '' }])
                    }
                  >
                    + Add Item
                  </button>
                  <div className="running-total">
                    <span className="running-total-label">Total:</span>
                    <span className="running-total-value">${runningTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    className="form-textarea"
                    value={newOrderNotes}
                    onChange={(event) => setNewOrderNotes(event.target.value)}
                  />
                </div>

                {createError && <div className="form-error">{createError}</div>}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={closeCreate} disabled={createLoading}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
