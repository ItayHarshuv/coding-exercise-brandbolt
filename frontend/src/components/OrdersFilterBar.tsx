import { OrderStatus } from "../types";

type OrdersFilterBarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  statuses: OrderStatus[];
  statusOptions: OrderStatus[];
  onToggleStatus: (status: OrderStatus) => void;
};

export default function OrdersFilterBar({
  searchDraft,
  onSearchDraftChange,
  statuses,
  statusOptions,
  onToggleStatus,
}: OrdersFilterBarProps) {
  return (
    <div className="filters-bar">
      <div className="filters-row">
        <input
          className="form-input"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
          placeholder="Search by customer name..."
        />
        <div className="form-checkbox-group">
          {statusOptions.map((status) => (
            <label
              key={status}
              className={`form-checkbox-label${statuses.includes(status) ? " checked" : ""}`}
            >
              <input
                type="checkbox"
                checked={statuses.includes(status)}
                onChange={() => onToggleStatus(status)}
              />
              {status}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
