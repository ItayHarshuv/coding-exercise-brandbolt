/**
 * Orders Page
 *
 * TODO: Implement the orders list page with the following features:
 *
 * DATA TABLE:
 * - Columns: ID, Customer Name, Status (colored badge), Total Amount, Date
 * - Row click navigates to order detail page
 *
 * FILTERING:
 * - Multi-select status filter dropdown (filter by one or more OrderStatus values)
 * - Text search input (debounced, ~300ms) that searches by customer name
 * - All filter values synced to URL search params (so filters persist on refresh)
 *
 * SORTING:
 * - Clickable column headers to sort
 * - Toggle between ASC/DESC on repeated clicks
 * - Sort state synced to URL search params
 *
 * PAGINATION:
 * - Page navigation (previous/next, page numbers)
 * - Page size selector (10 / 25 / 50)
 * - Display "Showing X-Y of Z" text
 * - Page/pageSize synced to URL search params
 *
 * BULK OPERATIONS:
 * - Checkbox on each row for selection
 * - "Select all on page" checkbox in header
 * - When items selected, show bulk action bar with:
 *   - Count of selected items
 *   - Status dropdown to pick target status
 *   - "Update Status" button that opens confirmation modal
 *   - Executes POST /api/orders/bulk-status
 *
 * CREATION:
 * - "New Order" button that opens an order creation form (modal or separate route)
 * - See CreateOrderForm description below
 *
 * ORDER CREATION FORM (modal or inline):
 * - Customer selector: searchable dropdown populated from GET /api/customers
 * - Line items section:
 *   - Each row: product selector (searchable), quantity input, calculated line total
 *   - "Add Item" button to add another line
 *   - Remove button on each line item
 *   - Running total displayed
 * - Notes textarea (optional)
 * - Form validation:
 *   - Customer is required
 *   - At least one line item
 *   - Quantity must be positive integer
 *   - Quantity must not exceed product stock
 * - Submit button with loading state
 * - Error display for server-side errors
 */

export default function OrdersPage() {
  return (
    <div>
      <h1>Orders</h1>
      <p>TODO: Implement orders list with filtering, sorting, pagination, and bulk operations.</p>
    </div>
  );
}
