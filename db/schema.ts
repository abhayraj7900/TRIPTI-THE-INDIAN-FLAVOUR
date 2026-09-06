import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    orderType: text('order_type').notNull(),
    tableNumber: text('table_number'),
    customerName: text('customer_name'),
    status: text('status').notNull().default('new'),
    paymentStatus: text('payment_status').notNull().default('pending'),
    paymentMethod: text('payment_method'),
    subtotal: integer('subtotal').notNull(),
    tax: integer('tax').notNull(),
    discount: integer('discount').notNull().default(0),
    total: integer('total').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('idx_orders_status_created_at').on(table.status, table.createdAt),
    index('idx_orders_payment_status').on(table.paymentStatus),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: text('order_id').notNull().references(() => orders.id),
    menuItemId: integer('menu_item_id').notNull(),
    name: text('name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    lineTotal: integer('line_total').notNull(),
  },
  (table) => [index('idx_order_items_order_id').on(table.orderId)],
);

export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  quantity: integer('quantity').notNull(),
  reorderAt: integer('reorder_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect;
