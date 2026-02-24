import { Order, OrderStatus } from "../types";

export type OrdersSortableColumn =
  | "id"
  | "status"
  | "totalAmount"
  | "createdAt";

type OrdersTableProps = {
  loading: boolean;
  orders: Order[];
  selectedIds: Set<number>;
  allOnPageSelected: boolean;
  sortBy: OrdersSortableColumn;
  sortDir: "ASC" | "DESC";
  statusClassMap: Record<OrderStatus, string>;
  pageStart: number;
  pageEnd: number;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizes: number[];
  onSort: (column: OrdersSortableColumn) => void;
  onToggleSelectAllOnPage: (checked: boolean) => void;
  onToggleOrderSelected: (orderId: number, checked: boolean) => void;
  onOrderClick: (orderId: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export default function OrdersTable({
  loading,
  orders,
  selectedIds,
  allOnPageSelected,
  sortBy,
  sortDir,
  statusClassMap,
  pageStart,
  pageEnd,
  total,
  page,
  totalPages,
  pageSize,
  pageSizes,
  onSort,
  onToggleSelectAllOnPage,
  onToggleOrderSelected,
  onOrderClick,
  onPageChange,
  onPageSizeChange,
}: OrdersTableProps) {
  const sortIndicator = (column: OrdersSortableColumn) => {
    if (sortBy !== column) return "";
    return sortDir === "ASC" ? " \u2191" : " \u2193";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner"></span>
        Loading orders...
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table table-clickable">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={(event) =>
                  onToggleSelectAllOnPage(event.target.checked)
                }
              />
            </th>
            <th>
              <button
                type="button"
                className={`sort-btn${sortBy === "id" ? " active" : ""}`}
                onClick={() => onSort("id")}
              >
                Customer / Order{sortIndicator("id")}
              </button>
            </th>
            <th>
              <button
                type="button"
                className={`sort-btn${sortBy === "status" ? " active" : ""}`}
                onClick={() => onSort("status")}
              >
                Status{sortIndicator("status")}
              </button>
            </th>
            <th>
              <button
                type="button"
                className={`sort-btn${sortBy === "totalAmount" ? " active" : ""}`}
                onClick={() => onSort("totalAmount")}
              >
                Total{sortIndicator("totalAmount")}
              </button>
            </th>
            <th>
              <button
                type="button"
                className={`sort-btn${sortBy === "createdAt" ? " active" : ""}`}
                onClick={() => onSort("createdAt")}
              >
                Date{sortIndicator("createdAt")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} onClick={() => onOrderClick(order.id)}>
              <td onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={(event) =>
                    onToggleOrderSelected(order.id, event.target.checked)
                  }
                />
              </td>
              <td>
                <div>{order.customer.name}</div>
                <div className="text-muted">#{order.id}</div>
              </td>
              <td>
                <span className={`badge badge-${statusClassMap[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className="font-semibold">
                ${Number(order.totalAmount).toFixed(2)}
              </td>
              <td className="text-muted">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="table-empty">
                No orders found.
              </td>
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
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`pagination-btn${pageNumber === page ? " active" : ""}`}
                disabled={pageNumber === page}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            className="pagination-btn"
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
        <div className="pagination-size">
          <span>Rows:</span>
          <select
            className="form-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
