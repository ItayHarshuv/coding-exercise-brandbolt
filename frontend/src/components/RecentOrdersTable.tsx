import { Order, STATUS_CLASS_MAP } from "../types";

type RecentOrdersTableProps = {
  orders: Order[];
  onOrderClick: (orderId: number) => void;
  formatCurrency: (value: number) => string;
};

export default function RecentOrdersTable({
  orders,
  onOrderClick,
  formatCurrency,
}: RecentOrdersTableProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Recent Orders</h2>
      </div>
      <div
        className="table-wrapper"
        style={{
          border: "none",
          borderRadius: 0,
          marginLeft: "calc(-1 * var(--space-lg))",
          marginRight: "calc(-1 * var(--space-lg))",
        }}
      >
        <table className="table table-clickable">
          <thead>
            <tr>
              <th>Customer / Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => onOrderClick(order.id)}>
                <td>
                  <div>{order.customer.name}</div>
                  <div className="text-muted">#{order.id}</div>
                </td>
                <td>
                  <span
                    className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="font-semibold">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="text-muted">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
