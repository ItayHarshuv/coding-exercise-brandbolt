type OrderCustomerSectionProps = {
  name: string;
  email: string;
  phone: string | null;
};

export default function OrderCustomerSection({
  name,
  email,
  phone,
}: OrderCustomerSectionProps) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">Customer</div>
      <div className="detail-field">
        <span className="detail-field-label">Name</span>
        <span className="detail-field-value">{name}</span>
      </div>
      <div className="detail-field">
        <span className="detail-field-label">Email</span>
        <span className="detail-field-value">{email}</span>
      </div>
      <div className="detail-field">
        <span className="detail-field-label">Phone</span>
        <span className="detail-field-value">{phone || "Not provided"}</span>
      </div>
    </div>
  );
}
