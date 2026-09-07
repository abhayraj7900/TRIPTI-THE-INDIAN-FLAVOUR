import { getD1Binding } from '@/db/d1';
import { normalizePhone } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderNumber = (url.searchParams.get('order') ?? '').trim().toUpperCase();
    const phone = normalizePhone(url.searchParams.get('phone') ?? '');
    if (!orderNumber || phone.length < 8) return Response.json({ error: 'Enter your order number and mobile number' }, { status: 400 });
    const db = getD1Binding();
    const order = await db.prepare(
      `SELECT id, order_number AS orderNumber, order_type AS orderType, table_number AS tableNumber,
        customer_name AS customerName, delivery_address AS deliveryAddress, latitude, longitude,
        status, payment_status AS paymentStatus, payment_method AS paymentMethod, notes,
        subtotal, tax, discount, total, created_at AS createdAt
      FROM orders WHERE order_number = ? AND customer_phone = ? LIMIT 1`,
    ).bind(orderNumber, phone).first<{ id: string } & Record<string, unknown>>();
    if (!order) return Response.json({ error: 'Order not found. Check the order number and phone.' }, { status: 404 });
    const { results: items } = await db.prepare(
      `SELECT menu_item_id AS menuItemId, name, quantity, unit_price AS unitPrice
       FROM order_items WHERE order_id = ? ORDER BY id`,
    ).bind(order.id).all();
    return Response.json({ order: { ...order, items } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to track order' }, { status: 500 });
  }
}
