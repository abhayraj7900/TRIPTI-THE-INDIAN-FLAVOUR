import { env } from 'cloudflare:workers';

import { getD1Binding } from '@/db/d1';
import {
  createCustomerCookie,
  createCustomerPin,
  normalizePhone,
  verifyCustomerPin,
} from '@/lib/auth';

type OtpInput = {
  action?: 'request' | 'verify_and_set_pin';
  phone?: string;
  otp?: string;
  pin?: string;
};

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as OtpInput;
    const phone = normalizePhone(input.phone ?? '');
    if (phone.length < 8)
      return Response.json(
        { error: 'Enter a valid mobile number' },
        { status: 400 },
      );
    const db = getD1Binding();

    if (input.action === 'request') {
      const recent = await db
        .prepare(
          'SELECT created_at AS createdAt FROM customer_otps WHERE phone = ? LIMIT 1',
        )
        .bind(phone)
        .first<{ createdAt: number }>();
      if (recent && Date.now() - recent.createdAt < 60000) {
        return Response.json(
          { error: 'Please wait one minute before requesting another OTP' },
          { status: 429 },
        );
      }

      if (!env.OTP_DELIVERY_WEBHOOK_URL) {
        return Response.json(
          {
            error:
              'OTP service is not connected yet. Add an SMS or WhatsApp OTP provider first.',
          },
          { status: 503 },
        );
      }

      const existing = await db
        .prepare('SELECT phone FROM customer_profiles WHERE phone = ? LIMIT 1')
        .bind(phone)
        .first();
      const purpose = existing ? 'reset' : 'signup';
      const otp = String(
        crypto.getRandomValues(new Uint32Array(1))[0] % 1000000,
      ).padStart(6, '0');
      const credentials = await createCustomerPin(otp);
      const now = Date.now();
      await db
        .prepare(
          `INSERT INTO customer_otps (phone, code_hash, code_salt, purpose, attempts, expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, ?, ?, ?)
           ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, code_salt = excluded.code_salt,
             purpose = excluded.purpose, attempts = 0, expires_at = excluded.expires_at,
             created_at = excluded.created_at, updated_at = excluded.updated_at`,
        )
        .bind(
          phone,
          credentials.pinHash,
          credentials.pinSalt,
          purpose,
          now + 10 * 60000,
          now,
          now,
        )
        .run();

      const delivery = await fetch(env.OTP_DELIVERY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.OTP_DELIVERY_WEBHOOK_SECRET
            ? { Authorization: `Bearer ${env.OTP_DELIVERY_WEBHOOK_SECRET}` }
            : {}),
        },
        body: JSON.stringify({
          phone,
          otp,
          purpose,
          message: `Your Tripti verification code is ${otp}. It expires in 10 minutes.`,
        }),
      });
      if (!delivery.ok)
        return Response.json(
          { error: 'OTP could not be delivered. Please try again.' },
          { status: 502 },
        );
      return Response.json({ sent: true, purpose, expiresInSeconds: 600 });
    }

    if (input.action === 'verify_and_set_pin') {
      const otp = input.otp?.replace(/\D/g, '') ?? '';
      const pin = input.pin?.replace(/\D/g, '') ?? '';
      if (!/^\d{6}$/.test(otp) || !/^\d{6}$/.test(pin)) {
        return Response.json(
          { error: 'Enter the 6 digit OTP and a new 6 digit PIN' },
          { status: 400 },
        );
      }
      const row = await db
        .prepare(
          `SELECT code_hash AS codeHash, code_salt AS codeSalt, attempts, expires_at AS expiresAt
           FROM customer_otps WHERE phone = ? LIMIT 1`,
        )
        .bind(phone)
        .first<{
          codeHash: string;
          codeSalt: string;
          attempts: number;
          expiresAt: number;
        }>();
      if (!row || row.expiresAt < Date.now()) {
        return Response.json(
          { error: 'OTP expired. Request a new OTP.' },
          { status: 410 },
        );
      }
      if (row.attempts >= 5)
        return Response.json(
          { error: 'Too many attempts. Request a new OTP.' },
          { status: 429 },
        );
      if (!(await verifyCustomerPin(otp, row.codeSalt, row.codeHash))) {
        await db
          .prepare(
            'UPDATE customer_otps SET attempts = attempts + 1, updated_at = ? WHERE phone = ?',
          )
          .bind(Date.now(), phone)
          .run();
        return Response.json({ error: 'Incorrect OTP' }, { status: 401 });
      }

      const credentials = await createCustomerPin(pin);
      const existing = await db
        .prepare('SELECT name FROM customer_profiles WHERE phone = ? LIMIT 1')
        .bind(phone)
        .first<{ name: string }>();
      const name = existing?.name || `Customer ${phone.slice(-4)}`;
      const now = Date.now();
      await db.batch([
        db
          .prepare(
            `INSERT INTO customer_profiles (phone, name, pin_hash, pin_salt, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(phone) DO UPDATE SET pin_hash = excluded.pin_hash, pin_salt = excluded.pin_salt,
               updated_at = excluded.updated_at`,
          )
          .bind(
            phone,
            name,
            credentials.pinHash,
            credentials.pinSalt,
            now,
            now,
          ),
        db.prepare('DELETE FROM customer_otps WHERE phone = ?').bind(phone),
      ]);
      const customer = { phone, name };
      return Response.json(
        { customer },
        { headers: { 'Set-Cookie': await createCustomerCookie(customer) } },
      );
    }

    return Response.json({ error: 'Invalid OTP action' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'OTP request failed' },
      { status: 500 },
    );
  }
}
