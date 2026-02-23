import "reflect-metadata";
import { DataSource } from "typeorm";
import { Customer } from "./entities/Customer";
import { Product } from "./entities/Product";
import { Order } from "./entities/Order";
import { OrderItem } from "./entities/OrderItem";
import { WebhookSubscription } from "./entities/WebhookSubscription";
import { WebhookDelivery } from "./entities/WebhookDelivery";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "orders",
  synchronize: true,
  logging: false,
  entities: [
    Customer,
    Product,
    Order,
    OrderItem,
    WebhookSubscription,
    WebhookDelivery,
  ],
});
