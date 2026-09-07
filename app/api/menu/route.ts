import { getD1Binding } from '@/db/d1';
import { isStaffRequest } from '@/lib/auth';
import { menu, type MenuItem } from '@/lib/restaurant-data';

type StoredMenuItem = MenuItem & { active: boolean };

function clean(input: Partial<StoredMenuItem>, id: number): StoredMenuItem {
  return {
    id,
    name: String(input.name ?? '').trim(),
    note: String(input.note ?? '').trim(),
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    category: String(input.category ?? 'Other').trim() || 'Other',
    veg: Boolean(input.veg),
    photo: Math.max(0, Math.round(Number(input.photo) || 0)),
    photoUrl: String(input.photoUrl ?? '').trim() || null,
    badge: String(input.badge ?? '').trim() || undefined,
    active: input.active !== false,
  };
}

export async function GET(request: Request) {
  try {
    const includeInactive = new URL(request.url).searchParams.get('includeInactive') === '1';
    if (includeInactive && !isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const db = getD1Binding();
    const { results } = await db.prepare(
      `SELECT id, name, note, price, category, veg, photo, photo_url AS photoUrl,
        badge, active FROM menu_items ORDER BY id`,
    ).all();
    const merged = new Map<number, StoredMenuItem>(menu.map((item) => [item.id, { ...item, photoUrl: item.photoUrl ?? null, active: true }]));
    for (const row of results as unknown as StoredMenuItem[]) merged.set(Number(row.id), { ...row, veg: Boolean(row.veg), active: Boolean(row.active) });
    const items = [...merged.values()].filter((item) => includeInactive || item.active).sort((a, b) => a.id - b.id);
    return Response.json({ items });
  } catch (error) {
    return Response.json({ items: menu.map((item) => ({ ...item, active: true })), error: error instanceof Error ? error.message : 'Unable to load menu' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const input = (await request.json()) as Partial<StoredMenuItem>;
    const db = getD1Binding();
    const row = await db.prepare('SELECT MAX(id) AS maxId FROM menu_items').first<{ maxId: number | null }>();
    const id = Math.max(menu.length, Number(row?.maxId) || 0) + 1;
    const item = clean(input, id);
    if (!item.name || !item.note || !item.price) return Response.json({ error: 'Name, description and price are required' }, { status: 400 });
    const now = Date.now();
    await db.prepare(
      `INSERT INTO menu_items (id, name, note, price, category, veg, photo, photo_url, badge, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(item.id, item.name, item.note, item.price, item.category, item.veg ? 1 : 0, item.photo, item.photoUrl, item.badge ?? null, item.active ? 1 : 0, now, now).run();
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to add menu item' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const input = (await request.json()) as Partial<StoredMenuItem>;
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Invalid menu item' }, { status: 400 });
    const item = clean(input, id);
    if (!item.name || !item.note || !item.price) return Response.json({ error: 'Name, description and price are required' }, { status: 400 });
    const now = Date.now();
    const db = getD1Binding();
    await db.prepare(
      `INSERT INTO menu_items (id, name, note, price, category, veg, photo, photo_url, badge, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, note = excluded.note, price = excluded.price,
         category = excluded.category, veg = excluded.veg, photo = excluded.photo, photo_url = excluded.photo_url,
         badge = excluded.badge, active = excluded.active, updated_at = excluded.updated_at`,
    ).bind(item.id, item.name, item.note, item.price, item.category, item.veg ? 1 : 0, item.photo, item.photoUrl, item.badge ?? null, item.active ? 1 : 0, now, now).run();
    return Response.json({ item });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update menu item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isStaffRequest(request)) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const input = (await request.json()) as Partial<StoredMenuItem>;
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Invalid menu item' }, { status: 400 });
    const current = clean(input, id);
    const now = Date.now();
    const db = getD1Binding();
    await db.prepare(
      `INSERT INTO menu_items (id, name, note, price, category, veg, photo, photo_url, badge, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT(id) DO UPDATE SET active = 0, updated_at = excluded.updated_at`,
    ).bind(id, current.name || 'Removed item', current.note || 'Removed', current.price, current.category, current.veg ? 1 : 0, current.photo, current.photoUrl, current.badge ?? null, now, now).run();
    return Response.json({ id, deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to remove menu item' }, { status: 500 });
  }
}
