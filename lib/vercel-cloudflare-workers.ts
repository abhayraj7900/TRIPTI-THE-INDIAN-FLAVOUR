// Vercel exposes string configuration through process.env. Cloudflare-only
// runtime bindings such as D1 and R2 remain unavailable until migrated.
export const env = new Proxy({} as Cloudflare.Env, {
  get(_target, property) {
    return typeof property === 'string' ? process.env[property] : undefined;
  },
});
