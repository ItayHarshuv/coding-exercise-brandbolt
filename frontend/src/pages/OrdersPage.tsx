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

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { ComboboxOption } from "../components/Combobox";
import CreateOrderModal from "../components/CreateOrderModal";
import OrdersBulkBar from "../components/OrdersBulkBar";
import OrdersFilterBar from "../components/OrdersFilterBar";
import OrdersTable, { OrdersSortableColumn } from "../components/OrdersTable";
import PageHeader from "../components/PageHeader";
import StatusChangeConfirmModal from "../components/StatusChangeConfirmModal";
import {
  BulkStatusResult,
  CreateOrderRequest,
  Customer,
  Order,
  OrderStatus,
  PaginatedResponse,
  Product,
  STATUS_CLASS_MAP,
} from "../types";

const PAGE_SIZES = [10, 25, 50];
const STATUS_OPTIONS = Object.values(OrderStatus);

type OrderCreateLine = { productId: number | null; quantity: number };

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ordersRefreshNonce, setOrdersRefreshNonce] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newOrderCustomerId, setNewOrderCustomerId] = useState<number | null>(
    null,
  );
  const [newOrderNotes, setNewOrderNotes] = useState("");
  const [newOrderItems, setNewOrderItems] = useState<OrderCreateLine[]>([
    { productId: null, quantity: 1 },
  ]);

  const statuses = useMemo(() => {
    const raw = searchParams.get("status");
    if (!raw) return [] as OrderStatus[];
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is OrderStatus =>
        STATUS_OPTIONS.includes(value as OrderStatus),
      );
  }, [searchParams]);
  const sortBy = (searchParams.get("sortBy") ||
    "createdAt") as OrdersSortableColumn;
  const sortDir = searchParams.get("sortDir") === "ASC" ? "ASC" : "DESC";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const pageSize = PAGE_SIZES.includes(Number(searchParams.get("pageSize")))
    ? Number(searchParams.get("pageSize"))
    : 10;
  const search = searchParams.get("search") || "";
  const [searchDraft, setSearchDraft] = useState(search);

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchDraft === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchDraft.trim()) next.set("search", searchDraft.trim());
      else next.delete("search");
      next.set("page", "1");
      setSearchParams(next);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchDraft, search, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.get<PaginatedResponse<Order>>("/orders", {
          params: {
            status: statuses.length ? statuses.join(",") : undefined,
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
          const idsInData = new Set(
            response.data.data.map((order) => order.id),
          );
          return new Set([...previous].filter((id) => idsInData.has(id)));
        });
      } catch (error: any) {
        setLoadError(error?.response?.data?.error || "Failed to load orders");
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
          api.get<Customer[]>("/customers"),
          api.get<Product[]>("/products"),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
      } catch (error: any) {
        setCreateError(
          error?.response?.data?.error || "Failed to load customers/products",
        );
      }
    };
    void fetchReferences();
  }, [isCreateOpen, customers.length, products.length]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  const customerOptions = useMemo<ComboboxOption<number>[]>(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name} (${customer.email})`,
        searchText: `${customer.name} ${customer.email}`,
      })),
    [customers],
  );

  const productOptions = useMemo<ComboboxOption<number>[]>(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.name} (${product.sku}) - $${Number(product.price).toFixed(2)} - stock: ${product.stockQuantity}`,
        searchText: `${product.name} ${product.sku}`,
      })),
    [products],
  );

  const runningTotal = newOrderItems.reduce((acc, item) => {
    const product = products.find(
      (productItem) => productItem.id === item.productId,
    );
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
      status: nextStatuses.length ? nextStatuses.join(",") : null,
      page: "1",
    });
  };

  const handleSort = (column: OrdersSortableColumn) => {
    if (sortBy === column) {
      updateParams({ sortDir: sortDir === "ASC" ? "DESC" : "ASC", page: "1" });
    } else {
      updateParams({ sortBy: column, sortDir: "ASC", page: "1" });
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

  const toggleOrderSelected = (orderId: number, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(orderId);
      else next.delete(orderId);
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
      const response = await api.post<BulkStatusResult>("/orders/bulk-status", {
        orderIds: Array.from(selectedIds),
        status: bulkStatus,
      });
      const { succeeded, failed } = response.data;
      setSelectedIds(new Set());
      setBulkStatus("");
      const summary = `Updated ${succeeded.length} orders, ${failed.length} failed.`;
      const successDetails = succeeded.map((id) => `#${id}`).join("\n");
      const failedDetails = failed
        .map(({ id, reason }) => `#${id}: ${reason}`)
        .join("\n");

      const sections = [summary];
      if (succeeded.length > 0) {
        sections.push(`Updated orders:\n${successDetails}`);
      }
      if (failed.length > 0) {
        sections.push(`Failed details:\n${failedDetails}`);
      }
      setBulkMessage(sections.join("\n\n"));
      setOrdersRefreshNonce((previous) => previous + 1);
    } catch (error: any) {
      setBulkMessage(error?.response?.data?.error || "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewOrderCustomerId(null);
    setNewOrderNotes("");
    setNewOrderItems([{ productId: null, quantity: 1 }]);
    setCreateError(null);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const validateCreateForm = (): string | null => {
    if (!newOrderCustomerId) return "Customer is required";
    if (newOrderItems.length === 0) return "At least one line item is required";
    for (const item of newOrderItems) {
      if (!item.productId) return "Every line must include a product";
      if (!Number.isInteger(item.quantity) || item.quantity <= 0)
        return "Quantity must be a positive integer";
      const product = products.find(
        (productEntry) => productEntry.id === item.productId,
      );
      if (!product) return "One or more selected products are invalid";
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
      items: newOrderItems.map((item) => ({
        productId: item.productId!,
        quantity: item.quantity,
      })),
      notes: newOrderNotes.trim() || undefined,
    };
    setCreateLoading(true);
    try {
      await api.post("/orders", payload);
      closeCreate();
      setOrdersRefreshNonce((previous) => previous + 1);
    } catch (error: any) {
      setCreateError(error?.response?.data?.error || "Failed to create order");
    } finally {
      setCreateLoading(false);
    }
  };

  const allOnPageSelected =
    orders.length > 0 && orders.every((order) => selectedIds.has(order.id));

  const handleItemProductChange = (index: number, productId: number | null) => {
    setNewOrderItems((previous) =>
      previous.map((line, lineIndex) =>
        lineIndex === index ? { ...line, productId } : line,
      ),
    );
  };

  const handleItemQuantityChange = (index: number, rawValue: string) => {
    const quantity = Number.parseInt(rawValue, 10);
    setNewOrderItems((previous) =>
      previous.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, quantity: Number.isNaN(quantity) ? 1 : quantity }
          : line,
      ),
    );
  };

  const handleRemoveItem = (index: number) => {
    setNewOrderItems((previous) =>
      previous.filter((_, lineIndex) => lineIndex !== index),
    );
  };

  const handleAddItem = () => {
    setNewOrderItems((previous) => [
      ...previous,
      { productId: null, quantity: 1 },
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage and track all customer orders"
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setIsCreateOpen(true)}
          >
            + New Order
          </button>
        }
      />

      <OrdersFilterBar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        statuses={statuses}
        statusOptions={STATUS_OPTIONS}
        onToggleStatus={toggleStatus}
      />

      <OrdersBulkBar
        selectedCount={selectedIds.size}
        bulkStatus={bulkStatus}
        statusOptions={STATUS_OPTIONS}
        bulkLoading={bulkLoading}
        onBulkStatusChange={setBulkStatus}
        onBulkUpdate={handleBulkUpdate}
      />

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
          Update <span className="font-bold">{selectedIds.size}</span> selected
          orders to <span className="font-bold">{bulkStatus}</span>?
        </p>
      </StatusChangeConfirmModal>

      <OrdersTable
        loading={loading}
        orders={orders}
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        sortBy={sortBy}
        sortDir={sortDir}
        statusClassMap={STATUS_CLASS_MAP}
        pageStart={pageStart}
        pageEnd={pageEnd}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizes={PAGE_SIZES}
        onSort={handleSort}
        onToggleSelectAllOnPage={toggleSelectAllOnPage}
        onToggleOrderSelected={toggleOrderSelected}
        onOrderClick={(orderId) => navigate(`/orders/${orderId}`)}
        onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
        onPageSizeChange={(size) =>
          updateParams({ pageSize: String(size), page: "1" })
        }
      />

      <CreateOrderModal
        isOpen={isCreateOpen}
        createLoading={createLoading}
        createError={createError}
        newOrderCustomerId={newOrderCustomerId}
        customerOptions={customerOptions}
        newOrderItems={newOrderItems}
        products={products}
        productOptions={productOptions}
        runningTotal={runningTotal}
        newOrderNotes={newOrderNotes}
        onClose={closeCreate}
        onSubmit={handleCreateSubmit}
        onCustomerChange={setNewOrderCustomerId}
        onItemProductChange={handleItemProductChange}
        onItemQuantityChange={handleItemQuantityChange}
        onRemoveItem={handleRemoveItem}
        onAddItem={handleAddItem}
        onNotesChange={setNewOrderNotes}
      />
    </div>
  );
}
