declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    CUSTOMER_SESSION_SECRET?: string;
    STAFF_USER_IDS?: string;
    STAFF_EMAILS?: string;
    STAFF_LOGIN_PHONE?: string;
    STAFF_LOGIN_PIN?: string;
    OTP_DELIVERY_WEBHOOK_URL?: string;
    OTP_DELIVERY_WEBHOOK_SECRET?: string;
    WHATSAPP_BOOKING_WEBHOOK_URL?: string;
    WHATSAPP_BOOKING_WEBHOOK_SECRET?: string;
  }
}
