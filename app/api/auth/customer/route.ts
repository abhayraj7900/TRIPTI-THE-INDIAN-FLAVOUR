import { getD1Binding } from '@/db/d1';
import {
  clearCustomerCookie,
  createCustomerCookie,
  normalizePhone,
  readCustomerSession,
  verifyCustomerPin,
} from '@/lib/auth';

export async function GET(request: Request) {
  return Response.json({
    customer: await readCustomerSession(request.headers.get('cookie')),
  });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { phone?: string; pin?: string };
    const phone = normalizePhone(input.phone ?? '');
    const pin = input.pin?.trim() ?? '';
    if (phone.length < 8 || !/^\d{6}$/.test(pin))
      return Response.json(
        { error: 'Enter a valid mobile number and exactly 6 digit PIN' },
        { status: 400 },
      );
    const db = getD1Binding();
    const existing = await db
      .prepare(
        'SELECT name, pin_hash AS pinHash, pin_salt AS pinSalt FROM customer_profiles WHERE phone = ? LIMIT 1',
      )
      .bind(phone)
      .first<{
        name: string;
        pinHash: string | null;
        pinSalt: string | null;
      }>();
    if (!existing?.pinHash || !existing.pinSalt) {
      return Response.json(
        {
          error: 'Verify your mobile OTP and set a PIN first',
          requiresOtp: true,
        },
        { status: 403 },
      );
    }
    if (!(await verifyCustomerPin(pin, existing.pinSalt, existing.pinHash))) {
      return Response.json(
        { error: 'Incorrect customer PIN' },
        { status: 401 },
      );
    }
    const name = existing.name;
    const customer = { name, phone };
    return Response.json(
      { customer },
      { headers: { 'Set-Cookie': await createCustomerCookie(customer) } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to sign in' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  return Response.json(
    { signedOut: true },
    { headers: { 'Set-Cookie': clearCustomerCookie() } },
  );
}
