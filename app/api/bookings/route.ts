import { getD1Binding } from '@/db/d1';
import { isStaffRequest, normalizePhone, readCustomerSession } from '@/lib/auth';

type BookingInput = {
  id?: string;
  customerName?: string;
  phone?: string;
  guests?: number;
  bookingDate?: string;
  bookingTime?: string;
  tableNumber?: string;
  notes?: string;
  status?: string;
};

const allowedStatuses = ['booked', 'completed', 'cancelled'];

export async function GET(request: Request) {
  try {
    if (!isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const db = getD1Binding();
    const { results } = await db.prepare(
      `SELECT id, booking_number AS bookingNumber, customer_name AS customerName,
        phone, guests, booking_date AS bookingDate, booking_time AS bookingTime,
        table_number AS tableNumber, notes, status, created_at AS createdAt, updated_at AS updatedAt
      FROM table_bookings ORDER BY booking_date DESC, booking_time DESC LIMIT 200`,
    ).all();
    return Response.json({ bookings: results });
  } catch (error) {
    return Response.json({ bookings: [], error: error instanceof Error ? error.message : 'Unable to load bookings' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as BookingInput;
    const session = await readCustomerSession(request.headers.get('cookie'));
    const staff = isStaffRequest(request);
    if (!staff && !session) return Response.json({ error: 'Customer sign-in required for table booking' }, { status: 401 });
    const customerName = session?.name ?? (staff ? input.customerName?.trim() : undefined);
    const phone = normalizePhone(session?.phone ?? (staff ? input.phone ?? '' : ''));
    const bookingDate = input.bookingDate?.trim();
    const bookingTime = input.bookingTime?.trim();
    const tableNumber = input.tableNumber?.trim().padStart(2, '0');
    const requestedGuests = Number(input.guests);
    const guests = Math.max(1, Math.min(20, requestedGuests));
    const tableIndex = Number(tableNumber);
    if (!customerName || !phone || !bookingDate || !bookingTime || !tableNumber || !Number.isFinite(requestedGuests) || requestedGuests < 1 || tableIndex < 1 || tableIndex > 16) {
      return Response.json({ error: 'Complete all required booking details' }, { status: 400 });
    }
    const db = getD1Binding();
    const conflict = await db.prepare(
      `SELECT id FROM table_bookings
       WHERE table_number = ? AND booking_date = ? AND booking_time = ? AND status = 'booked' LIMIT 1`,
    ).bind(tableNumber, bookingDate, bookingTime).first();
    if (conflict) return Response.json({ error: 'This table is already booked for that time' }, { status: 409 });

    const now = Date.now();
    const id = crypto.randomUUID();
    const bookingNumber = `BKG-${String(now).slice(-6)}`;
    await db.prepare(
      `INSERT INTO table_bookings (
        id, booking_number, customer_name, phone, guests, booking_date, booking_time,
        table_number, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?)`,
    ).bind(id, bookingNumber, customerName, phone, guests, bookingDate, bookingTime, tableNumber, input.notes?.trim() || null, now, now).run();
    return Response.json({
      booking: {
        id, bookingNumber, customerName, phone, guests, bookingDate, bookingTime,
        tableNumber, notes: input.notes?.trim() || null, status: 'booked', createdAt: now, updatedAt: now,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to create booking' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const input = (await request.json()) as BookingInput;
    if (!input.id || !input.status || !allowedStatuses.includes(input.status)) {
      return Response.json({ error: 'Invalid booking update' }, { status: 400 });
    }
    const db = getD1Binding();
    const result = await db.prepare(
      'UPDATE table_bookings SET status = ?, updated_at = ? WHERE id = ?',
    ).bind(input.status, Date.now(), input.id).run();
    if (!result.meta.changes) return Response.json({ error: 'Booking not found' }, { status: 404 });
    return Response.json({ id: input.id, status: input.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update booking' }, { status: 500 });
  }
}
