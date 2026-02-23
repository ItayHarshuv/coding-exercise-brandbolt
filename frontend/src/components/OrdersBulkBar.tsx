import { OrderStatus } from "../types";

type OrdersBulkBarProps = {
  selectedCount: number;
  bulkStatus: OrderStatus | "";
  statusOptions: OrderStatus[];
  bulkLoading: boolean;
  onBulkStatusChange: (status: OrderStatus | "") => void;
  onBulkUpdate: () => void;
};

export default function OrdersBulkBar({
  selectedCount,
  bulkStatus,
  statusOptions,
  bulkLoading,
  onBulkStatusChange,
  onBulkUpdate,
}: OrdersBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar">
      <span className="bulk-bar-count">{selectedCount}</span>
      <span className="text-secondary">selected</span>
      <select
        className="form-select"
        value={bulkStatus}
        onChange={(event) =>
          onBulkStatusChange(event.target.value as OrderStatus | "")
        }
      >
        <option value="">Select status</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        className="btn btn-accent btn-sm"
        type="button"
        disabled={!bulkStatus || bulkLoading}
        onClick={onBulkUpdate}
      >
        {bulkLoading ? "Updating..." : "Update Status"}
      </button>
    </div>
  );
}
