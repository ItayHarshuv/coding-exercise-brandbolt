# Order Processing System — Take-Home Assignment

## Overview

Build a full-stack order processing system with status workflows, webhook integrations, and a dashboard. You are allowed to use any AI tool you find necessary for the task, however, you must understand the code in the final assignment and be able to defend and justify it.

**Expected time:** 2–3 days

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Project

```bash
docker compose up --build
```

This starts three services:

| Service    | URL                     | Description                    |
|------------|-------------------------|--------------------------------|
| Frontend   | http://localhost:5173   | React + Vite dev server (HMR) |
| Backend    | http://localhost:3000   | Express API server             |
| PostgreSQL | localhost:5432          | Database (auto-initialized)    |

The backend automatically connects to PostgreSQL, synchronizes the schema, and seeds sample data (5 customers, 10 products, 20 orders).

Both frontend and backend support hot-reload — your code changes will reflect immediately.

### Provided Helper Endpoints

These endpoints are already implemented for your convenience:

- `GET /api/health` — Health check
- `GET /api/customers` — List all customers
- `GET /api/products` — List all products

---

## What You Need to Build

All TypeORM entities, database setup, Docker configuration, and project scaffolding are provided. You need to implement the **route handlers** (backend) and **page components** (frontend).

### Backend

Implement the route handlers in `backend/src/routes/`. Each file has detailed JSDoc comments describing the expected behavior.

#### Orders API (`routes/orders.ts`)

| Method | Endpoint                    | Description                                    |
|--------|-----------------------------|------------------------------------------------|
| GET    | `/api/orders`               | List orders with filters, sorting, pagination  |
| POST   | `/api/orders`               | Create a new order with line items             |
| GET    | `/api/orders/:id`           | Get order with all relations                   |
| PATCH  | `/api/orders/:id`           | Update order fields (notes, status)            |
| PATCH  | `/api/orders/:id/status`    | Status transition with validation              |
| POST   | `/api/orders/bulk-status`   | Bulk update status for multiple orders         |

**Status transitions must follow this state machine:**

```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → PROCESSING, CANCELLED
PROCESSING → SHIPPED, CANCELLED
SHIPPED → DELIVERED
DELIVERED → (terminal)
CANCELLED → (terminal)
```

#### Webhooks API (`routes/webhooks.ts`)

| Method | Endpoint                            | Description                  |
|--------|-------------------------------------|------------------------------|
| GET    | `/api/webhooks`                     | List subscriptions           |
| POST   | `/api/webhooks`                     | Create subscription          |
| PUT    | `/api/webhooks/:id`                 | Update subscription          |
| DELETE | `/api/webhooks/:id`                 | Delete subscription          |
| GET    | `/api/webhooks/:id/deliveries`      | Delivery log for subscription|
| POST   | `/api/webhooks/:id/test`            | Send test payload            |
| POST   | `/api/webhooks/deliveries/:id/retry`| Retry a failed delivery      |

#### Dashboard API (`routes/dashboard.ts`)

| Method | Endpoint               | Description                                      |
|--------|------------------------|--------------------------------------------------|
| GET    | `/api/dashboard/stats` | Status counts, total revenue, 10 recent orders   |

#### Webhook Service (`services/webhook.service.ts`)

Implement `triggerWebhooks()` and `retryWebhookDelivery()`. The function signatures and detailed implementation steps are provided in the file.

---

### Frontend

Implement the page components in `frontend/src/pages/`. Each file has detailed JSDoc comments describing the expected UI and behavior. Create any additional components you need in `frontend/src/components/`.

#### Orders Page (`pages/OrdersPage.tsx`)
- Data table with ID, customer, status badge, total, date
- Multi-select status filter
- Debounced text search on customer name
- Column sorting (clickable headers)
- Pagination with page size selector (10/25/50)
- **All filters, sort, and pagination synced to URL search params**
- Checkbox selection with bulk status update
- Order creation form with dynamic line items

#### Order Detail Page (`pages/OrderDetailPage.tsx`)
- Full order info with customer details and line items table
- Status change dropdown (only valid transitions) with confirmation modal
- Status timeline visualization
- Edit mode toggle for mutable fields (notes)
- Unsaved changes warning on navigation

#### Webhooks Page (`pages/WebhooksPage.tsx`)
- Subscription list with active/inactive toggle
- Create/edit subscription form with event type checkboxes
- Expandable delivery log per subscription (paginated)
- Test webhook button with result modal
- Retry button on failed deliveries
- Auto-refresh toggle for delivery logs

#### Dashboard Page (`pages/DashboardPage.tsx`)
- Status breakdown cards (color-coded, count per status)
- Total revenue display
- Recent orders list (last 10, clickable rows)
- Auto-refresh with configurable interval and toggle

---

## Styling

No UI component library is provided. A minimal CSS reset and design tokens (colors, spacing, typography) are in `frontend/src/index.css`. You are expected to style the application yourself.

**Design and UX quality matters.** We evaluate:
- Visual hierarchy and layout
- Consistent use of color, spacing, and typography
- Interactive states (hover, focus, loading, disabled)
- Responsive considerations
- Thoughtful use of the provided CSS variables

**NOTE**. It is expected that the page will look good. It's up to you how to position everything, and what colors to use. The code just provides a bare template

---

## Project Structure

```
backend/src/
├── index.ts                # Express server (provided)
├── database.ts             # TypeORM DataSource (provided)
├── seed.ts                 # Seed data (provided)
├── entities/               # TypeORM entities (provided)
├── middleware/             # Error handler (provided)
├── services/
│   └── webhook.service.ts  # TODO: implement
└── routes/
    ├── orders.ts           # TODO: implement
    ├── webhooks.ts         # TODO: implement
    └── dashboard.ts        # TODO: implement

frontend/src/
├── main.tsx                # Entry point (provided)
├── App.tsx                 # Router shell (provided)
├── index.css               # CSS reset + variables (provided)
├── types/index.ts          # TypeScript types (provided)
├── api/client.ts           # Axios instance (provided)
├── pages/                  # TODO: implement
│   ├── OrdersPage.tsx
│   ├── OrderDetailPage.tsx
│   ├── WebhooksPage.tsx
│   └── DashboardPage.tsx
└── components/             # TODO: create as needed
```

---

## Tips

- Read the JSDoc comments in each TODO file thoroughly — they describe exactly what to implement.
- The TypeScript types in `frontend/src/types/index.ts` mirror the backend entities. Use them.
- The Axios client in `frontend/src/api/client.ts` is pre-configured with the proxy to the backend.
- The seed data gives you 20 orders across all statuses — useful for testing filters and pagination.
- You can inspect the database directly: `docker compose exec postgres psql -U postgres -d orders`
