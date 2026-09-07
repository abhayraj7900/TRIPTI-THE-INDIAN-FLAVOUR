import { getD1Binding } from '@/db/d1';
import { readCustomerSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const customer = await readCustomerSession(request.headers.get('cookie'));
    if (!customer) return Response.json({ error: 'Customer sign-in required' }, { status: 401 });
    const db = getD1Binding();
    const [ordersResult, itemsResult, bookingsResult] = await db.batch([
      db.prepare(
        `SELECT id, order_number AS orderNumber, order_type AS orderType, table_number AS tableNumber,
          customer_name AS customerName, customer_phone AS customerPhone, delivery_address AS deliveryAddress,
          latitude, longitude, status, payment_status AS paymentStatus, payment_method AS paymentMethod,
          notes, subtotal, tax, discount, total, created_at AS createdAt
        FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 50`,
      ).bind(customer.phone),
      db.prepare(
        `SELECT oi.order_id AS orderId, oi.menu_item_id AS menuItemId, oi.name, oi.quantity, oi.unit_price AS unitPrice
        FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.customer_phone = ? ORDER BY oi.id`,
      ).bind(customer.phone),
      db.prepare(
        `SELECT id, booking_number AS bookingNumber, customer_name AS customerName, phone, guests,
          booking_date AS bookingDate, booking_time AS bookingTime, table_number AS tableNumber,
          notes, status, created_at AS createdAt, updated_at AS updatedAt
        FROM table_bookings WHERE phone = ? ORDER BY booking_date DESC, booking_time DESC LIMIT 50`,
      ).bind(customer.phone),
    ]);
    const itemsByOrder = new Map<string, unknown[]>();
    for (const row of itemsResult.results as Array<{ orderId: string }>) {
      const list = itemsByOrder.get(row.orderId) ?? [];
      const { orderId: _orderId, ...item } = row;
      list.push(item); itemsByOrder.set(row.orderId, list);
    }
    const orders = (ordersResult.results as Array<{ id: string }>).map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] }));
    return Response.json({ customer, orders, bookings: bookingsResult.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to load account' }, { status: 500 });
  }
}
