import { getD1Binding } from '@/db/d1';

type OrderItemInput = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

export async function GET() {
  try {
    const db = getD1Binding();
    const { results } = await db
      .prepare(
        `SELECT id, order_number AS orderNumber, order_type AS orderType,
          table_number AS tableNumber, customer_name AS customerName,
          status, payment_status AS paymentStatus, payment_method AS paymentMethod,
          subtotal, tax, discount, total, created_at AS createdAt
        FROM orders ORDER BY created_at DESC LIMIT 100`,
      )
      .all();
    return Response.json({ orders: results });
  } catch (error) {
    return Response.json({ orders: [], error: error instanceof Error ? error.message : 'Unable to load orders' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      orderType?: string;
      tableNumber?: string;
      customerName?: string;
      paymentMethod?: string;
      discount?: number;
      items?: OrderItemInput[];
    };
    const items = (input.items ?? []).filter(
      (item) => item.quantity > 0 && item.unitPrice >= 0 && item.name.trim(),
    );
    if (!items.length) return Response.json({ error: 'Add at least one item' }, { status: 400 });

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * 0.05);
    const discount = Math.max(0, Math.min(Number(input.discount) || 0, subtotal));
    const total = subtotal + tax - discount;
    const now = Date.now();
    const id = crypto.randomUUID();
    const orderNumber = `TRP-${String(now).slice(-6)}`;
    const db = getD1Binding();

    const statements = [
      db.prepare(
        `INSERT INTO orders (
          id, order_number, order_type, table_number, customer_name, status,
          payment_status, payment_method, subtotal, tax, discount, total, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        orderNumber,
        input.orderType ?? 'Dine in',
        input.tableNumber ?? null,
        input.customerName?.trim() || null,
        'new',
        input.paymentMethod ? 'paid' : 'pending',
        input.paymentMethod ?? null,
        subtotal,
        tax,
        discount,
        total,
        now,
        now,
      ),
      ...items.map((item) =>
        db.prepare(
          `INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(id, item.menuItemId, item.name.trim(), item.quantity, item.unitPrice, item.quantity * item.unitPrice),
      ),
    ];
    await db.batch(statements);
    return Response.json(
      { order: { id, orderNumber, orderType: input.orderType ?? 'Dine in', tableNumber: input.tableNumber ?? null, customerName: input.customerName ?? null, status: 'new', paymentStatus: input.paymentMethod ? 'paid' : 'pending', paymentMethod: input.paymentMethod ?? null, subtotal, tax, discount, total, createdAt: now } },
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = (await request.json()) as { id?: string; status?: string; paymentStatus?: string };
    const allowedStatuses = ['new', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!input.id || !input.status || !allowedStatuses.includes(input.status)) {
      return Response.json({ error: 'Invalid order update' }, { status: 400 });
    }
    const db = getD1Binding();
    const result = await db
      .prepare('UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), updated_at = ? WHERE id = ?')
      .bind(input.status, input.paymentStatus ?? null, Date.now(), input.id)
      .run();
    if (!result.meta.changes) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json({ id: input.id, status: input.status, paymentStatus: input.paymentStatus });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update order' }, { status: 500 });
  }
}
