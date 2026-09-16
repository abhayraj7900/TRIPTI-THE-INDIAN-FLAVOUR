import {
  clearStaffCookie,
  createCustomerPin,
  createStaffCookie,
  isStaffRequest,
  normalizePhone,
  readStaffSession,
  staffLoginConfigured,
  verifyCustomerPin,
  verifyStaffCredentials,
} from '@/lib/auth';
import { getD1Binding } from '@/db/d1';

export async function GET(request: Request) {
  const staff = await readStaffSession(request.headers.get('cookie'));
  return Response.json({ staff });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { phone?: string; pin?: string };
    const phone = normalizePhone(input.phone ?? '');
    const pin = (input.pin ?? '').replace(/\D/g, '');
    const db = getD1Binding();
    const now = Date.now();
    const attempt = await db
      .prepare(
        'SELECT attempts, locked_until AS lockedUntil FROM staff_login_attempts WHERE identifier = ? LIMIT 1',
      )
      .bind(phone || 'invalid')
      .first<{ attempts: number; lockedUntil: number }>();
    if (attempt && attempt.lockedUntil > now) {
      return Response.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 },
      );
    }
    const account = await db
      .prepare(
        'SELECT phone, name, pin_hash AS pinHash, pin_salt AS pinSalt FROM staff_accounts WHERE phone = ? LIMIT 1',
      )
      .bind(phone)
      .first<{
        phone: string;
        name: string;
        pinHash: string;
        pinSalt: string;
      }>();
    const valid = account
      ? await verifyCustomerPin(pin, account.pinSalt, account.pinHash)
      : staffLoginConfigured() && verifyStaffCredentials(phone, pin);
    if (!valid) {
      const attempts = (attempt?.attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? now + 15 * 60_000 : 0;
      await db
        .prepare(
          `INSERT INTO staff_login_attempts (identifier, attempts, locked_until, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(identifier) DO UPDATE SET attempts = excluded.attempts,
             locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
        )
        .bind(phone || 'invalid', attempts >= 5 ? 0 : attempts, lockedUntil, now)
        .run();
      return Response.json(
        {
          error:
            attempts >= 5
              ? 'Too many attempts. Try again in 15 minutes.'
              : 'Incorrect phone number or PIN.',
        },
        { status: attempts >= 5 ? 429 : 401 },
      );
    }
    await db
      .prepare('DELETE FROM staff_login_attempts WHERE identifier = ?')
      .bind(phone)
      .run();
    if (!account) {
      const credentials = await createCustomerPin(pin);
      await db
        .prepare(
          `INSERT INTO staff_accounts (phone, name, pin_hash, pin_salt, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          phone,
          'Abhay Raj',
          credentials.pinHash,
          credentials.pinSalt,
          now,
          now,
        )
        .run();
    }
    const staff = {
      phone,
      name: account?.name || 'Abhay Raj',
      role: 'manager' as const,
    };
    return Response.json(
      { staff },
      { headers: { 'Set-Cookie': await createStaffCookie(staff) } },
    );
  } catch {
    return Response.json({ error: 'Staff sign in failed.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return Response.json(
        { error: 'Staff sign-in required.' },
        { status: 401 },
      );
    }
    const session = await readStaffSession(request.headers.get('cookie'));
    if (!session) {
      return Response.json(
        { error: 'Phone/PIN staff session required.' },
        { status: 401 },
      );
    }
    const input = (await request.json()) as {
      currentPin?: string;
      newPin?: string;
    };
    const currentPin = (input.currentPin ?? '').replace(/\D/g, '');
    const newPin = (input.newPin ?? '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
      return Response.json(
        { error: 'Current and new PIN must contain exactly 6 digits.' },
        { status: 400 },
      );
    }
    if (currentPin === newPin) {
      return Response.json(
        { error: 'Choose a different new PIN.' },
        { status: 400 },
      );
    }
    const db = getD1Binding();
    const account = await db
      .prepare(
        'SELECT pin_hash AS pinHash, pin_salt AS pinSalt FROM staff_accounts WHERE phone = ? LIMIT 1',
      )
      .bind(session.phone)
      .first<{ pinHash: string; pinSalt: string }>();
    if (
      !account ||
      !(await verifyCustomerPin(currentPin, account.pinSalt, account.pinHash))
    ) {
      return Response.json({ error: 'Current PIN is incorrect.' }, { status: 401 });
    }
    const credentials = await createCustomerPin(newPin);
    await db
      .prepare(
        'UPDATE staff_accounts SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE phone = ?',
      )
      .bind(
        credentials.pinHash,
        credentials.pinSalt,
        Date.now(),
        session.phone,
      )
      .run();
    return Response.json({ changed: true });
  } catch {
    return Response.json({ error: 'PIN could not be changed.' }, { status: 500 });
  }
}

export async function DELETE() {
  return Response.json(
    { signedOut: true },
    { headers: { 'Set-Cookie': clearStaffCookie() } },
  );
}
