type StatCardProps = {
  label: string;
  value: string | number;
  variant: string;
  valueClassName?: string;
};

export default function StatCard({ label, value, variant, valueClassName }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <span className="stat-card-label">{label}</span>
      <span className={`stat-card-value${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</span>
    </div>
  );
}
