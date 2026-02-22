/**
 * Order Detail Page
 *
 * TODO: Implement the order detail view with the following features:
 *
 * ORDER INFO DISPLAY:
 * - Order ID, status (colored badge), dates (created, updated)
 * - Customer info (name, email, phone)
 * - Order notes
 * - Total amount
 *
 * STATUS MANAGEMENT:
 * - Status change dropdown showing only valid transitions:
 *   PENDING -> CONFIRMED, CANCELLED
 *   CONFIRMED -> PROCESSING, CANCELLED
 *   PROCESSING -> SHIPPED, CANCELLED
 *   SHIPPED -> DELIVERED
 *   DELIVERED -> (terminal)
 *   CANCELLED -> (terminal)
 * - Confirmation modal before status change ("Are you sure you want to change status from X to Y?")
 * - Calls PATCH /api/orders/:id/status
 * - Shows success/error feedback
 *
 * STATUS TIMELINE:
 * - Visual timeline/history showing order status progression
 * - Highlight the current status
 * - Show which statuses have been passed through
 *
 * LINE ITEMS TABLE:
 * - Columns: Product Name, SKU, Unit Price, Quantity, Line Total
 * - Subtotal row at bottom
 *
 * EDIT MODE:
 * - Toggle button to switch between view and edit mode
 * - In edit mode: notes field becomes editable
 * - Save/Cancel buttons appear in edit mode
 * - Calls PATCH /api/orders/:id to save changes
 *
 * UNSAVED CHANGES:
 * - Track if user has made changes in edit mode
 * - Show warning/confirmation when navigating away with unsaved changes
 *   (use beforeunload event and/or React Router's useBlocker/prompt)
 *
 * LOADING & ERROR STATES:
 * - Loading skeleton/spinner while fetching
 * - Error display if order not found (404)
 * - Back button/link to return to orders list
 */

import { useParams } from 'react-router-dom';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>Order #{id}</h1>
      <p>TODO: Implement order detail view with status management, edit mode, and line items.</p>
    </div>
  );
}
