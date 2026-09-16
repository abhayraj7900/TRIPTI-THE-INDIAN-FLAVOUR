import { env } from 'cloudflare:workers';

export type CustomerSession = { phone: string; name: string };
export type StaffSession = { phone: string; name: string; role: 'manager' };

const encoder = new TextEncoder();

function secret() {
  return env.CUSTOMER_SESSION_SECRET || 'tripti-local-development-session-key';
}

function toBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return new Uint8Array(Array.from(binary, (character) => character.charCodeAt(0)));
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function signedCookie(name: string, session: object, maxAge: number) {
  const payload = toBase64Url(JSON.stringify(session));
  const signed = `${payload}.${await signature(payload)}`;
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  return `${name}=${signed}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`;
}

async function readSignedCookie<T>(name: string, cookieHeader: string | null) {
  const raw = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!raw) return null;
  const [payload, suppliedSignature] = raw.split('.');
  if (
    !payload ||
    !suppliedSignature ||
    !secureEqual(suppliedSignature, await signature(payload))
  )
    return null;
  try {
    return JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as T;
  } catch {
    return null;
  }
}

async function pinDigest(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const normalizedSalt = new Uint8Array(salt.byteLength);
  normalizedSalt.set(salt);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: normalizedSalt, iterations: 120000 }, key, 256);
  return toBase64Url(new Uint8Array(bits));
}

export async function createCustomerPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { pinHash: await pinDigest(pin, salt), pinSalt: toBase64Url(salt) };
}

export async function verifyCustomerPin(pin: string, pinSalt: string, expectedHash: string) {
  const suppliedHash = await pinDigest(pin, fromBase64Url(pinSalt));
  if (suppliedHash.length !== expectedHash.length) return false;
  let mismatch = 0;
  for (let index = 0; index < suppliedHash.length; index += 1) mismatch |= suppliedHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  return mismatch === 0;
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(-15);
}

export async function createCustomerCookie(session: CustomerSession) {
  return signedCookie('tripti_customer', session, 2592000);
}

export function clearCustomerCookie() {
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  return `tripti_customer=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`;
}

export async function readCustomerSession(cookieHeader: string | null): Promise<CustomerSession | null> {
  const session = await readSignedCookie<CustomerSession>(
    'tripti_customer',
    cookieHeader,
  );
  return session?.phone && session.name ? session : null;
}

export async function createStaffCookie(session: StaffSession) {
  return signedCookie('tripti_staff', session, 43200);
}

export function clearStaffCookie() {
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  return `tripti_staff=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`;
}

export async function readStaffSession(
  cookieHeader: string | null,
): Promise<StaffSession | null> {
  const session = await readSignedCookie<StaffSession>(
    'tripti_staff',
    cookieHeader,
  );
  return session?.phone && session.name && session.role === 'manager'
    ? session
    : null;
}

export function staffLoginConfigured() {
  return Boolean(
    normalizePhone(env.STAFF_LOGIN_PHONE || '') &&
      /^\d{6}$/.test(env.STAFF_LOGIN_PIN || ''),
  );
}

export function verifyStaffCredentials(phone: string, pin: string) {
  const expectedPhone = normalizePhone(env.STAFF_LOGIN_PHONE || '');
  const expectedPin = env.STAFF_LOGIN_PIN || '';
  const suppliedPhone = normalizePhone(phone);
  const suppliedPin = pin.replace(/\D/g, '');
  return Boolean(
    expectedPhone &&
      /^\d{6}$/.test(expectedPin) &&
      secureEqual(suppliedPhone, expectedPhone) &&
      secureEqual(suppliedPin, expectedPin),
  );
}

export function isStaffIdentity(userId: string | null, email: string | null) {
  if (process.env.NODE_ENV === 'development') return true;
  const allowedIds = (env.STAFF_USER_IDS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const allowedEmails = (env.STAFF_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return Boolean((userId && allowedIds.includes(userId)) || (email && allowedEmails.includes(email.toLowerCase())));
}

export async function isStaffRequest(request: Request) {
  if (
    isStaffIdentity(
      request.headers.get('oai-authenticated-user-id'),
      request.headers.get('oai-authenticated-user-email'),
    )
  )
    return true;
  return Boolean(await readStaffSession(request.headers.get('cookie')));
}
