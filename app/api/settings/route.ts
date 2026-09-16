import { getD1Binding } from '@/db/d1';
import { isStaffRequest } from '@/lib/auth';
import { defaultCustomerSettings, type CustomerSettings } from '@/lib/restaurant-data';

export async function GET() {
  try {
    const row = await getD1Binding().prepare("SELECT value FROM site_settings WHERE key = 'customer'").first<{ value: string }>();
    const saved = row?.value ? JSON.parse(row.value) as Partial<CustomerSettings> : {};
    return Response.json({ settings: { ...defaultCustomerSettings, ...saved } });
  } catch (error) {
    return Response.json({ settings: defaultCustomerSettings, error: error instanceof Error ? error.message : 'Unable to load settings' });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isStaffRequest(request))) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const input = (await request.json()) as Partial<CustomerSettings>;
    const settings: CustomerSettings = {
      offerEnabled: Boolean(input.offerEnabled),
      offerTitle: String(input.offerTitle ?? '').trim(),
      offerText: String(input.offerText ?? '').trim(),
      bannerImageUrl: String(input.bannerImageUrl ?? '').trim(),
      instagramUrl: String(input.instagramUrl ?? '').trim(),
      facebookUrl: String(input.facebookUrl ?? '').trim(),
      youtubeUrl: String(input.youtubeUrl ?? '').trim(),
      whatsappNumber: String(input.whatsappNumber ?? '').trim(),
      restaurantAddress: String(input.restaurantAddress ?? '').trim(),
      googleMapsUrl: String(input.googleMapsUrl ?? '').trim(),
    };
    const now = Date.now();
    await getD1Binding().prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ('customer', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).bind(JSON.stringify(settings), now).run();
    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update settings' }, { status: 500 });
  }
}
