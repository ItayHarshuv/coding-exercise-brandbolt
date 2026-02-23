// These types mirror the backend entities.
// Use them throughout the frontend for type safety.

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export const STATUS_CLASS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'pending',
  [OrderStatus.CONFIRMED]: 'confirmed',
  [OrderStatus.PROCESSING]: 'processing',
  [OrderStatus.SHIPPED]: 'shipped',
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.CANCELLED]: 'cancelled',
};

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  product: Product;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  customer: Customer;
  customerId: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookSubscription {
  id: number;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: number;
  subscriptionId: number;
  orderId: number;
  event: string;
  payload: Record<string, any>;
  statusCode: number | null;
  responseBody: string | null;
  success: boolean;
  attemptNumber: number;
  deliveredAt: string | null;
  createdAt: string;
}

// API response types

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  statusCounts: Record<OrderStatus, number>;
  totalRevenue: number;
  recentOrders: Order[];
}

export interface BulkStatusResult {
  succeeded: number[];
  failed: Array<{ id: number; reason: string }>;
}

// Request types

export interface CreateOrderRequest {
  customerId: number;
  items: Array<{ productId: number; quantity: number }>;
  notes?: string;
}

export interface CreateWebhookRequest {
  url: string;
  secret: string;
  events: string[];
  isActive?: boolean;
}
