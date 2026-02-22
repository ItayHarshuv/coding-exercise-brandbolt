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

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>TODO: Implement dashboard with status breakdown, revenue, and recent orders.</p>
    </div>
  );
}
