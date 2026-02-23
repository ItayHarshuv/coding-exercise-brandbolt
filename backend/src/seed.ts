import { AppDataSource } from "./database";
import { Customer } from "./entities/Customer";
import { Product } from "./entities/Product";
import { Order, OrderStatus } from "./entities/Order";
import { OrderItem } from "./entities/OrderItem";

export async function seed() {
  const customerRepo = AppDataSource.getRepository(Customer);
  const productRepo = AppDataSource.getRepository(Product);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);

  // Skip seeding if data already exists
  const existingOrders = await orderRepo.count();
  if (existingOrders > 0) {
    console.log("[Seed] Data already exists, skipping seed.");
    return;
  }

  console.log("[Seed] Seeding database...");

  // --- Customers ---
  const customers = await customerRepo.save([
    { name: "Alice Johnson", email: "alice@example.com", phone: "555-0101" },
    { name: "Bob Smith", email: "bob@example.com", phone: "555-0102" },
    { name: "Carol Williams", email: "carol@example.com", phone: "555-0103" },
    { name: "David Brown", email: "david@example.com", phone: "555-0104" },
    { name: "Eve Davis", email: "eve@example.com", phone: "555-0105" },
  ]);

  // --- Products ---
  const products = await productRepo.save([
    { name: "Wireless Mouse", sku: "WM-001", price: 29.99, stockQuantity: 150 },
    {
      name: "Mechanical Keyboard",
      sku: "MK-001",
      price: 89.99,
      stockQuantity: 75,
    },
    { name: "USB-C Hub", sku: "UH-001", price: 49.99, stockQuantity: 200 },
    { name: '27" Monitor', sku: "MN-001", price: 349.99, stockQuantity: 30 },
    { name: "Webcam HD", sku: "WC-001", price: 69.99, stockQuantity: 100 },
    { name: "Desk Lamp", sku: "DL-001", price: 39.99, stockQuantity: 120 },
    { name: "Laptop Stand", sku: "LS-001", price: 59.99, stockQuantity: 80 },
    {
      name: "Noise-Canceling Headphones",
      sku: "NH-001",
      price: 199.99,
      stockQuantity: 45,
    },
    { name: "Mousepad XL", sku: "MP-001", price: 19.99, stockQuantity: 300 },
    {
      name: "Cable Management Kit",
      sku: "CM-001",
      price: 14.99,
      stockQuantity: 250,
    },
  ]);

  // --- Orders ---
  const statuses = Object.values(OrderStatus);

  const orderDefinitions: Array<{
    customerIdx: number;
    status: OrderStatus;
    items: Array<{ productIdx: number; quantity: number }>;
    notes?: string;
  }> = [
    {
      customerIdx: 0,
      status: OrderStatus.PENDING,
      items: [
        { productIdx: 0, quantity: 2 },
        { productIdx: 2, quantity: 1 },
      ],
    },
    {
      customerIdx: 0,
      status: OrderStatus.CONFIRMED,
      items: [{ productIdx: 1, quantity: 1 }],
      notes: "Express shipping requested",
    },
    {
      customerIdx: 1,
      status: OrderStatus.PROCESSING,
      items: [
        { productIdx: 3, quantity: 1 },
        { productIdx: 4, quantity: 1 },
      ],
    },
    {
      customerIdx: 1,
      status: OrderStatus.SHIPPED,
      items: [{ productIdx: 5, quantity: 3 }],
    },
    {
      customerIdx: 2,
      status: OrderStatus.DELIVERED,
      items: [
        { productIdx: 6, quantity: 1 },
        { productIdx: 7, quantity: 1 },
      ],
      notes: "Gift wrapped",
    },
    {
      customerIdx: 2,
      status: OrderStatus.CANCELLED,
      items: [{ productIdx: 8, quantity: 5 }],
      notes: "Customer changed mind",
    },
    {
      customerIdx: 3,
      status: OrderStatus.PENDING,
      items: [
        { productIdx: 9, quantity: 2 },
        { productIdx: 0, quantity: 1 },
      ],
    },
    {
      customerIdx: 3,
      status: OrderStatus.CONFIRMED,
      items: [
        { productIdx: 1, quantity: 2 },
        { productIdx: 2, quantity: 2 },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.PROCESSING,
      items: [{ productIdx: 3, quantity: 2 }],
    },
    {
      customerIdx: 4,
      status: OrderStatus.PENDING,
      items: [
        { productIdx: 4, quantity: 1 },
        { productIdx: 5, quantity: 1 },
        { productIdx: 6, quantity: 1 },
      ],
    },
    {
      customerIdx: 0,
      status: OrderStatus.SHIPPED,
      items: [{ productIdx: 7, quantity: 1 }],
    },
    {
      customerIdx: 1,
      status: OrderStatus.DELIVERED,
      items: [
        { productIdx: 8, quantity: 10 },
        { productIdx: 9, quantity: 5 },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PENDING,
      items: [{ productIdx: 0, quantity: 1 }],
    },
    {
      customerIdx: 3,
      status: OrderStatus.PROCESSING,
      items: [
        { productIdx: 1, quantity: 1 },
        { productIdx: 3, quantity: 1 },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.CONFIRMED,
      items: [{ productIdx: 2, quantity: 3 }],
    },
    {
      customerIdx: 0,
      status: OrderStatus.CANCELLED,
      items: [{ productIdx: 5, quantity: 2 }],
      notes: "Duplicate order",
    },
    {
      customerIdx: 1,
      status: OrderStatus.PENDING,
      items: [{ productIdx: 6, quantity: 1 }],
    },
    {
      customerIdx: 2,
      status: OrderStatus.SHIPPED,
      items: [
        { productIdx: 7, quantity: 2 },
        { productIdx: 8, quantity: 3 },
      ],
    },
    {
      customerIdx: 3,
      status: OrderStatus.DELIVERED,
      items: [
        { productIdx: 9, quantity: 1 },
        { productIdx: 0, quantity: 4 },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.PROCESSING,
      items: [
        { productIdx: 1, quantity: 1 },
        { productIdx: 4, quantity: 2 },
      ],
    },
  ];

  for (const def of orderDefinitions) {
    const order = orderRepo.create({
      customer: customers[def.customerIdx],
      status: def.status,
      notes: def.notes || null,
      totalAmount: 0,
    });
    const savedOrder = await orderRepo.save(order);

    let total = 0;
    for (const itemDef of def.items) {
      const product = products[itemDef.productIdx];
      const lineTotal = Number(product.price) * itemDef.quantity;
      total += lineTotal;

      const item = orderItemRepo.create({
        order: savedOrder,
        product,
        quantity: itemDef.quantity,
        unitPrice: product.price,
        lineTotal,
      });
      await orderItemRepo.save(item);
    }

    savedOrder.totalAmount = Math.round(total * 100) / 100;
    await orderRepo.save(savedOrder);
  }

  console.log(
    `[Seed] Created ${customers.length} customers, ${products.length} products, ${orderDefinitions.length} orders.`,
  );
}
