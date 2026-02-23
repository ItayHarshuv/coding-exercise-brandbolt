import { OrderStatus } from '../types';

type OrderStatusChangeSelectProps = {
  options: OrderStatus[];
  disabled?: boolean;
  onSelect: (status: OrderStatus) => void;
};

export default function OrderStatusChangeSelect({ options, disabled = false, onSelect }: OrderStatusChangeSelectProps) {
  if (options.length === 0) return null;

  return (
    <select
      className="form-select"
      style={{ width: 'auto', minWidth: 180 }}
      defaultValue=""
      onChange={(event) => {
        const value = event.target.value as OrderStatus | '';
        if (!value) return;
        onSelect(value);
        event.target.value = '';
      }}
      disabled={disabled}
    >
      <option value="">Change status...</option>
      {options.map((statusOption) => (
        <option key={statusOption} value={statusOption}>
          {statusOption}
        </option>
      ))}
    </select>
  );
}
