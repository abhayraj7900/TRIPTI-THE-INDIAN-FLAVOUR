declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    CUSTOMER_SESSION_SECRET?: string;
    STAFF_USER_IDS?: string;
  }
}
