/**
 * Dashboard Page
 *
 * TODO: Implement the dashboard with the following features:
 *
 * STATUS BREAKDOWN:
 * - Cards/tiles showing count of orders per status
 * - Each card should be visually distinct (color-coded by status)
 * - Display: status name, count
 *
 * REVENUE:
 * - Total revenue card (sum of non-cancelled orders)
 * - Formatted as currency
 *
 * RECENT ORDERS:
 * - List/table of the 10 most recent orders
 * - Columns: Order ID, Customer, Status (badge), Total, Date
 * - Rows clickable to navigate to order detail
 *
 * AUTO-REFRESH:
 * - Toggle switch to enable/disable auto-refresh
 * - Configurable interval (e.g., dropdown: 5s, 10s, 30s)
 * - Visual indicator when auto-refresh is active
 * - Fetches GET /api/dashboard/stats on interval
 *
 * LOADING STATE:
 * - Show loading indicator on initial load
 * - On subsequent refreshes, show subtle loading indicator without replacing content
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { DashboardStats, OrderStatus } from '../types';

const REFRESH_OPTIONS = [5, 10, 30];

const STATUS_CLASS_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: 'pending',
  [OrderStatus.CONFIRMED]: 'confirmed',
  [OrderStatus.PROCESSING]: 'processing',
  [OrderStatus.SHIPPED]: 'shipped',
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.CANCELLED]: 'cancelled',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10);

  const loadStats = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Failed to load dashboard stats');
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStats(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      void loadStats(false);
    }, refreshInterval * 1000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

  const statusOrder = Object.values(OrderStatus);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your order system performance</p>
        </div>
        <div className="page-header-actions">
          {refreshing && (
            <span className="refreshing-indicator">
              <span className="spinner"></span>
              Refreshing
            </span>
          )}
          <label className="toggle">
            <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
            <span className="toggle-track"></span>
            Auto-refresh
          </label>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 70 }}
            value={refreshInterval}
            onChange={(event) => setRefreshInterval(Number(event.target.value))}
            disabled={!autoRefresh}
          >
            {REFRESH_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds}s
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" type="button" onClick={() => void loadStats(false)} disabled={refreshing}>
            Refresh
          </button>
          {autoRefresh && <span className="badge badge-active">Live</span>}
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <span className="spinner"></span>
          Loading dashboard...
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && stats && (
        <>
          <div className="card-grid card-grid-4 mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="stat-card stat-card--revenue">
              <span className="stat-card-label">Total Revenue</span>
              <span className="stat-card-value revenue">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            {statusOrder.map((status) => (
              <div key={status} className={`stat-card stat-card--${STATUS_CLASS_MAP[status]}`}>
                <span className="stat-card-label">{status}</span>
                <span className="stat-card-value">{stats.statusCounts[status] ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Orders</h2>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
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
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                      <td className="font-semibold">#{order.id}</td>
                      <td>{order.customer.name}</td>
                      <td>
                        <span className={`badge badge-${STATUS_CLASS_MAP[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="font-semibold">{formatCurrency(order.totalAmount)}</td>
                      <td className="text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
