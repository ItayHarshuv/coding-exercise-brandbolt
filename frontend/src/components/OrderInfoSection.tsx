import { OrderStatus, STATUS_CLASS_MAP } from "../types";

type OrderInfoSectionProps = {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
};

export default function OrderInfoSection({
  status,
  createdAt,
  updatedAt,
  totalAmount,
}: OrderInfoSectionProps) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">Order Info</div>
      <div className="detail-field">
        <span className="detail-field-label">Status</span>
        <span className="detail-field-value">
          <span className={`badge badge-${STATUS_CLASS_MAP[status]}`}>
            {status}
          </span>
        </span>
      </div>
      <div className="detail-field">
        <span className="detail-field-label">Created</span>
        <span className="detail-field-value">
          {new Date(createdAt).toLocaleString()}
        </span>
      </div>
      <div className="detail-field">
        <span className="detail-field-label">Updated</span>
        <span className="detail-field-value">
          {new Date(updatedAt).toLocaleString()}
        </span>
      </div>
      <div className="detail-field">
        <span className="detail-field-label">Total</span>
        <span className="detail-field-value large">
          ${Number(totalAmount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
