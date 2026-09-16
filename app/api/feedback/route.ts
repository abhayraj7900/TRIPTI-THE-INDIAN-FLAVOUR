import { getD1Binding } from '@/db/d1';
import {
  isStaffRequest,
  normalizePhone,
  readCustomerSession,
} from '@/lib/auth';

type FeedbackInput = {
  orderNumber?: string;
  phone?: string;
  foodRating?: number;
  serviceRating?: number;
  notes?: string;
};

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return Response.json(
        { error: 'Staff sign-in required' },
        { status: 401 },
      );
    }
    const db = getD1Binding();
    const { results } = await db
      .prepare(
        `SELECT f.order_id AS orderId, o.order_number AS orderNumber,
          o.order_type AS orderType, o.customer_name AS customerName,
          f.customer_phone AS customerPhone, f.table_number AS tableNumber,
          f.food_rating AS foodRating, f.service_rating AS serviceRating,
          f.notes, f.created_at AS createdAt, f.updated_at AS updatedAt
         FROM order_feedback f
         INNER JOIN orders o ON o.id = f.order_id
         ORDER BY f.updated_at DESC LIMIT 250`,
      )
      .all();
    return Response.json({ reviews: results });
  } catch (error) {
    return Response.json(
      {
        reviews: [],
        error:
          error instanceof Error
            ? error.message
            : 'Reviews could not be loaded',
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as FeedbackInput;
    const orderNumber = input.orderNumber?.trim().toUpperCase();
    const session = await readCustomerSession(request.headers.get('cookie'));
    const phone = normalizePhone(session?.phone ?? input.phone ?? '');
    const foodRating = Number(input.foodRating);
    const serviceRating = Number(input.serviceRating);
    if (
      !orderNumber ||
      phone.length < 8 ||
      !Number.isInteger(foodRating) ||
      foodRating < 1 ||
      foodRating > 5 ||
      !Number.isInteger(serviceRating) ||
      serviceRating < 1 ||
      serviceRating > 5
    ) {
      return Response.json(
        { error: 'Choose both ratings from 1 to 5' },
        { status: 400 },
      );
    }

    const db = getD1Binding();
    const order = await db
      .prepare(
        `SELECT id, table_number AS tableNumber, status
         FROM orders WHERE order_number = ? AND customer_phone = ? LIMIT 1`,
      )
      .bind(orderNumber, phone)
      .first<{ id: string; tableNumber: string | null; status: string }>();
    if (!order)
      return Response.json({ error: 'Order not found' }, { status: 404 });
    if (!['served', 'completed'].includes(order.status)) {
      return Response.json(
        { error: 'Rating opens after your food is served' },
        { status: 409 },
      );
    }

    const now = Date.now();
    await db
      .prepare(
        `INSERT INTO order_feedback (
          order_id, customer_phone, table_number, food_rating, service_rating, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET food_rating = excluded.food_rating,
          service_rating = excluded.service_rating, notes = excluded.notes, updated_at = excluded.updated_at`,
      )
      .bind(
        order.id,
        phone,
        order.tableNumber,
        foodRating,
        serviceRating,
        input.notes?.trim().slice(0, 1000) || null,
        now,
        now,
      )
      .run();
    return Response.json({ saved: true, foodRating, serviceRating });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Feedback could not be saved',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return Response.json(
        { error: 'Staff sign-in required' },
        { status: 401 },
      );
    }
    const input = (await request.json()) as {
      orderId?: string;
      orderIds?: string[];
    };
    const orderIds = [
      ...new Set([
        ...(Array.isArray(input.orderIds) ? input.orderIds : []),
        ...(input.orderId ? [input.orderId] : []),
      ]),
    ]
      .filter(
        (id): id is string =>
          typeof id === 'string' && id.length > 0 && id.length <= 80,
      )
      .slice(0, 100);
    if (!orderIds.length) {
      return Response.json(
        { error: 'Select at least one review' },
        { status: 400 },
      );
    }

    const db = getD1Binding();
    const placeholders = orderIds.map(() => '?').join(', ');
    const result = await db
      .prepare(`DELETE FROM order_feedback WHERE order_id IN (${placeholders})`)
      .bind(...orderIds)
      .run();
    if (!result.meta.changes) {
      return Response.json({ error: 'Reviews not found' }, { status: 404 });
    }
    return Response.json({ orderIds, deleted: result.meta.changes });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to delete reviews',
      },
      { status: 500 },
    );
  }
}
