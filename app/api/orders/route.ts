import { getD1Binding } from '@/db/d1';

type OrderItemInput = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

type OrderUpdateInput = {
  id?: string;
  orderType?: string;
  tableNumber?: string | null;
  customerName?: string | null;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  discount?: number;
  items?: OrderItemInput[];
};

const allowedStatuses = ['new', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
const allowedPaymentStatuses = ['pending', 'paid', 'refunded'];
const allowedOrderTypes = ['Dine in', 'Takeaway', 'Delivery'];

function validItems(items: OrderItemInput[] | undefined) {
  return (items ?? []).filter(
    (item) => Number.isInteger(item.menuItemId) && item.quantity > 0 && item.unitPrice >= 0 && item.name.trim(),
  );
}

function totals(items: OrderItemInput[], requestedDiscount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.round(subtotal * 0.05);
  const discount = Math.max(0, Math.min(Number(requestedDiscount) || 0, subtotal));
  return { subtotal, tax, discount, total: subtotal + tax - discount };
}

export async function GET() {
  try {
    const db = getD1Binding();
    const [{ results: orderRows }, { results: itemRows }] = await db.batch([
      db.prepare(
        `SELECT id, order_number AS orderNumber, order_type AS orderType,
          table_number AS tableNumber, customer_name AS customerName,
          status, payment_status AS paymentStatus, payment_method AS paymentMethod,
          notes, subtotal, tax, discount, total, created_at AS createdAt
        FROM orders ORDER BY created_at DESC LIMIT 100`,
      ),
      db.prepare(
        `SELECT oi.order_id AS orderId, oi.menu_item_id AS menuItemId, oi.name,
          oi.quantity, oi.unit_price AS unitPrice
        FROM order_items oi
        INNER JOIN (SELECT id FROM orders ORDER BY created_at DESC LIMIT 100) recent
          ON recent.id = oi.order_id
        ORDER BY oi.id ASC`,
      ),
    ]);
    const itemsByOrder = new Map<string, unknown[]>();
    for (const row of itemRows as Array<{ orderId: string }>) {
      const items = itemsByOrder.get(row.orderId) ?? [];
      const { orderId: _orderId, ...item } = row;
      items.push(item);
      itemsByOrder.set(row.orderId, items);
    }
    const orders = (orderRows as Array<{ id: string }>).map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
    }));
    return Response.json({ orders });
  } catch (error) {
    return Response.json({ orders: [], error: error instanceof Error ? error.message : 'Unable to load orders' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as OrderUpdateInput;
    const items = validItems(input.items);
    if (!items.length) return Response.json({ error: 'Add at least one item' }, { status: 400 });
    if (!allowedOrderTypes.includes(input.orderType ?? '')) return Response.json({ error: 'Choose a valid order type' }, { status: 400 });

    const amount = totals(items, input.discount);
    const now = Date.now();
    const id = crypto.randomUUID();
    const orderNumber = `TRP-${String(now).slice(-6)}`;
    const paymentMethod = input.paymentMethod?.trim() || null;
    const db = getD1Binding();

    await db.batch([
      db.prepare(
        `INSERT INTO orders (
          id, order_number, order_type, table_number, customer_name, status,
          payment_status, payment_method, notes, subtotal, tax, discount, total, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        orderNumber,
        input.orderType,
        input.orderType === 'Dine in' ? input.tableNumber?.trim() || null : null,
        input.customerName?.trim() || null,
        'new',
        paymentMethod ? 'paid' : 'pending',
        paymentMethod,
        input.notes?.trim() || null,
        amount.subtotal,
        amount.tax,
        amount.discount,
        amount.total,
        now,
        now,
      ),
      ...items.map((item) =>
        db.prepare(
          `INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(id, item.menuItemId, item.name.trim(), item.quantity, item.unitPrice, item.quantity * item.unitPrice),
      ),
    ]);
    return Response.json({
      order: {
        id,
        orderNumber,
        orderType: input.orderType,
        tableNumber: input.orderType === 'Dine in' ? input.tableNumber?.trim() || null : null,
        customerName: input.customerName?.trim() || null,
        status: 'new',
        paymentStatus: paymentMethod ? 'paid' : 'pending',
        paymentMethod,
        notes: input.notes?.trim() || null,
        ...amount,
        createdAt: now,
        items,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = (await request.json()) as OrderUpdateInput;
    if (!input.id) return Response.json({ error: 'Order id is required' }, { status: 400 });
    const db = getD1Binding();

    if (input.items) {
      const items = validItems(input.items);
      if (!items.length || !allowedOrderTypes.includes(input.orderType ?? '') || !allowedStatuses.includes(input.status ?? '') || !allowedPaymentStatuses.includes(input.paymentStatus ?? '')) {
        return Response.json({ error: 'Invalid order details' }, { status: 400 });
      }
      const amount = totals(items, input.discount);
      const now = Date.now();
      const statements = [
        db.prepare(
          `UPDATE orders SET order_type = ?, table_number = ?, customer_name = ?, status = ?,
            payment_status = ?, payment_method = ?, notes = ?, subtotal = ?, tax = ?, discount = ?,
            total = ?, updated_at = ? WHERE id = ?`,
        ).bind(
          input.orderType,
          input.orderType === 'Dine in' ? input.tableNumber?.trim() || null : null,
          input.customerName?.trim() || null,
          input.status,
          input.paymentStatus,
          input.paymentMethod?.trim() || null,
          input.notes?.trim() || null,
          amount.subtotal,
          amount.tax,
          amount.discount,
          amount.total,
          now,
          input.id,
        ),
        db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(input.id),
        ...items.map((item) =>
          db.prepare(
            `INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).bind(input.id, item.menuItemId, item.name.trim(), item.quantity, item.unitPrice, item.quantity * item.unitPrice),
        ),
      ];
      const results = await db.batch(statements);
      if (!results[0].meta.changes) return Response.json({ error: 'Order not found' }, { status: 404 });
      return Response.json({
        order: {
          id: input.id,
          orderType: input.orderType,
          tableNumber: input.orderType === 'Dine in' ? input.tableNumber?.trim() || null : null,
          customerName: input.customerName?.trim() || null,
          status: input.status,
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod?.trim() || null,
          notes: input.notes?.trim() || null,
          ...amount,
          items,
        },
      });
    }

    if (!input.status || !allowedStatuses.includes(input.status) || (input.paymentStatus && !allowedPaymentStatuses.includes(input.paymentStatus))) {
      return Response.json({ error: 'Invalid order update' }, { status: 400 });
    }
    const result = await db.prepare(
      'UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), updated_at = ? WHERE id = ?',
    ).bind(input.status, input.paymentStatus ?? null, Date.now(), input.id).run();
    if (!result.meta.changes) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json({ id: input.id, status: input.status, paymentStatus: input.paymentStatus });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const input = (await request.json()) as { id?: string };
    if (!input.id) return Response.json({ error: 'Order id is required' }, { status: 400 });
    const db = getD1Binding();
    const results = await db.batch([
      db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(input.id),
      db.prepare('DELETE FROM orders WHERE id = ?').bind(input.id),
    ]);
    if (!results[1].meta.changes) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json({ id: input.id, deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to delete order' }, { status: 500 });
  }
}
