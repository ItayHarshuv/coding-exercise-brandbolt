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
        style={{ border: "none", borderRadius: 0 }}
      >
        <table className="table table-clickable">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => onOrderClick(order.id)}>
                <td className="font-semibold">#{order.id}</td>
                <td>{order.customer.name}</td>
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
                  {new Date(order.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
