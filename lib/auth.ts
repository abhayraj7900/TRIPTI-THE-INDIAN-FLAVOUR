import { env } from 'cloudflare:workers';

export type CustomerSession = { phone: string; name: string };

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

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(-15);
}

export async function createCustomerCookie(session: CustomerSession) {
  const payload = toBase64Url(JSON.stringify(session));
  const signed = `${payload}.${await signature(payload)}`;
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  return `tripti_customer=${signed}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=2592000`;
}

export function clearCustomerCookie() {
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  return `tripti_customer=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`;
}

export async function readCustomerSession(cookieHeader: string | null): Promise<CustomerSession | null> {
  const raw = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith('tripti_customer='))?.slice('tripti_customer='.length);
  if (!raw) return null;
  const [payload, suppliedSignature] = raw.split('.');
  if (!payload || !suppliedSignature || suppliedSignature !== await signature(payload)) return null;
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const session = JSON.parse(decoded) as CustomerSession;
    return session.phone && session.name ? session : null;
  } catch {
    return null;
  }
}

export function isStaffUserId(userId: string | null) {
  if (process.env.NODE_ENV === 'development') return true;
  const allowed = (env.STAFF_USER_IDS || '').split(',').map((value) => value.trim()).filter(Boolean);
  return Boolean(userId && allowed.includes(userId));
}

export function isStaffRequest(request: Request) {
  return isStaffUserId(request.headers.get('oai-authenticated-user-id'));
}
