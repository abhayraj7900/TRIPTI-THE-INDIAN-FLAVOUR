import { getD1Binding } from '@/db/d1';
import { clearCustomerCookie, createCustomerCookie, normalizePhone, readCustomerSession } from '@/lib/auth';

export async function GET(request: Request) {
  return Response.json({ customer: await readCustomerSession(request.headers.get('cookie')) });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { name?: string; phone?: string };
    const name = input.name?.trim() ?? '';
    const phone = normalizePhone(input.phone ?? '');
    if (name.length < 2 || phone.length < 8) return Response.json({ error: 'Enter your name and a valid mobile number' }, { status: 400 });
    const now = Date.now();
    await getD1Binding().prepare(
      `INSERT INTO customer_profiles (phone, name, created_at, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`,
    ).bind(phone, name, now, now).run();
    const customer = { name, phone };
    return Response.json({ customer }, { headers: { 'Set-Cookie': await createCustomerCookie(customer) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to sign in' }, { status: 500 });
  }
}

export async function DELETE() {
  return Response.json({ signedOut: true }, { headers: { 'Set-Cookie': clearCustomerCookie() } });
}
