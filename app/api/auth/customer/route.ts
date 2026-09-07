import { getD1Binding } from '@/db/d1';
import { clearCustomerCookie, createCustomerCookie, createCustomerPin, normalizePhone, readCustomerSession, verifyCustomerPin } from '@/lib/auth';

export async function GET(request: Request) {
  return Response.json({ customer: await readCustomerSession(request.headers.get('cookie')) });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { phone?: string; pin?: string };
    const phone = normalizePhone(input.phone ?? '');
    const pin = input.pin?.trim() ?? '';
    if (phone.length < 8 || !/^\d{6}$/.test(pin)) return Response.json({ error: 'Enter a valid mobile number and exactly 6 digit PIN' }, { status: 400 });
    const now = Date.now();
    const db = getD1Binding();
    const existing = await db.prepare(
      'SELECT name, pin_hash AS pinHash, pin_salt AS pinSalt FROM customer_profiles WHERE phone = ? LIMIT 1',
    ).bind(phone).first<{ name: string; pinHash: string | null; pinSalt: string | null }>();
    if (existing?.pinHash && existing.pinSalt && !await verifyCustomerPin(pin, existing.pinSalt, existing.pinHash)) {
      return Response.json({ error: 'Incorrect customer PIN' }, { status: 401 });
    }
    const name = existing?.name || `Customer ${phone.slice(-4)}`;
    const credentials = existing?.pinHash && existing.pinSalt
      ? { pinHash: existing.pinHash, pinSalt: existing.pinSalt }
      : await createCustomerPin(pin);
    await db.prepare(
      `INSERT INTO customer_profiles (phone, name, pin_hash, pin_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET pin_hash = excluded.pin_hash,
         pin_salt = excluded.pin_salt, updated_at = excluded.updated_at`,
    ).bind(phone, name, credentials.pinHash, credentials.pinSalt, now, now).run();
    const customer = { name, phone };
    return Response.json({ customer }, { headers: { 'Set-Cookie': await createCustomerCookie(customer) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to sign in' }, { status: 500 });
  }
}

export async function DELETE() {
  return Response.json({ signedOut: true }, { headers: { 'Set-Cookie': clearCustomerCookie() } });
}
