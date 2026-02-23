import { ReactNode } from 'react';

type PageRefreshControlsProps = {
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  refreshing: boolean;
  refreshInterval: number;
  onRefreshIntervalChange: (seconds: number) => void;
  refreshOptions: number[];
  onRefresh: () => void;
  refreshDisabled?: boolean;
  refreshButtonLabel?: string;
  children?: ReactNode;
};

export default function PageRefreshControls({
  autoRefresh,
  onAutoRefreshChange,
  refreshing,
  refreshInterval,
  onRefreshIntervalChange,
  refreshOptions,
  onRefresh,
  refreshDisabled = false,
  refreshButtonLabel = 'Refresh',
  children,
}: PageRefreshControlsProps) {
  return (
    <div className="page-header-actions">
      {refreshing && (
        <span className="refreshing-indicator">
          <span className="spinner"></span>
          Refreshing
        </span>
      )}

      <label className="toggle">
        <input type="checkbox" checked={autoRefresh} onChange={(event) => onAutoRefreshChange(event.target.checked)} />
        <span className="toggle-track"></span>
        Auto-refresh
      </label>

      <select
        className="form-select"
        style={{ width: 'auto', minWidth: 70 }}
        value={refreshInterval}
        onChange={(event) => onRefreshIntervalChange(Number(event.target.value))}
        disabled={!autoRefresh}
      >
        {refreshOptions.map((seconds) => (
          <option key={seconds} value={seconds}>
            {seconds}s
          </option>
        ))}
      </select>

      <button className="btn btn-secondary" type="button" onClick={onRefresh} disabled={refreshDisabled || refreshing}>
        {refreshButtonLabel}
      </button>

      {autoRefresh && <span className="badge badge-active">Live</span>}

      {children}
    </div>
  );
}
