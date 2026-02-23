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
import PageRefreshControls from '../components/PageRefreshControls';
import PageHeader from '../components/PageHeader';
import RecentOrdersTable from '../components/RecentOrdersTable';
import StatCard from '../components/StatCard';
import { DashboardStats, OrderStatus, STATUS_CLASS_MAP } from '../types';

const REFRESH_OPTIONS = [5, 10, 30];

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
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your order system performance"
        actions={
          <PageRefreshControls
            refreshing={refreshing}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
            refreshOptions={REFRESH_OPTIONS}
            onRefresh={() => void loadStats(false)}
            refreshDisabled={refreshing}
          />
        }
      />

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
            <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} variant="revenue" valueClassName="revenue" />
            {statusOrder.map((status) => (
              <StatCard key={status} label={status} value={stats.statusCounts[status] ?? 0} variant={STATUS_CLASS_MAP[status]} />
            ))}
          </div>

          <RecentOrdersTable
            orders={stats.recentOrders}
            onOrderClick={(orderId) => navigate(`/orders/${orderId}`)}
            formatCurrency={formatCurrency}
          />
        </>
      )}
    </div>
  );
}
