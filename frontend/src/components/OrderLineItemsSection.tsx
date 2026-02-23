import { OrderItem } from "../types";

type OrderLineItemsSectionProps = {
  items: OrderItem[];
  subtotal: number;
};

export default function OrderLineItemsSection({
  items,
  subtotal,
}: OrderLineItemsSectionProps) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">Line Items</div>
      <div
        className="table-wrapper"
        style={{ border: "none", borderRadius: 0 }}
      >
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
            {items.map((item) => (
              <tr key={item.id}>
                <td
                  className="font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {item.product.name}
                </td>
                <td>
                  <span className="text-mono text-xs">{item.product.sku}</span>
                </td>
                <td>${Number(item.unitPrice).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td
                  className="font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  ${Number(item.lineTotal).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="table-subtotal">
              <td colSpan={4}>Subtotal</td>
              <td>${Number(subtotal).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
