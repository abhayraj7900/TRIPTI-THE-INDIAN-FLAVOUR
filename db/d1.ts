import { env } from 'cloudflare:workers';

export function getD1Binding() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  return env.DB;
}
