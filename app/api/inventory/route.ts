import { getD1Binding } from '@/db/d1';

export async function GET() {
  try {
    const { results } = await getD1Binding()
      .prepare('SELECT id, name, category, unit, quantity, reorder_at AS reorderAt, updated_at AS updatedAt FROM inventory ORDER BY name')
      .all();
    return Response.json({ inventory: results });
  } catch (error) {
    return Response.json({ inventory: [], error: error instanceof Error ? error.message : 'Unable to load inventory' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = (await request.json()) as { id?: string; name?: string; category?: string; unit?: string; quantity?: number; reorderAt?: number };
    if (!input.id || !input.name || !input.category || !input.unit || !Number.isFinite(input.quantity) || !Number.isFinite(input.reorderAt)) {
      return Response.json({ error: 'Invalid inventory item' }, { status: 400 });
    }
    const now = Date.now();
    await getD1Binding()
      .prepare(
        `INSERT INTO inventory (id, name, category, unit, quantity, reorder_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, category = excluded.category,
         unit = excluded.unit, quantity = excluded.quantity, reorder_at = excluded.reorder_at, updated_at = excluded.updated_at`,
      )
      .bind(input.id, input.name, input.category, input.unit, input.quantity, input.reorderAt, now)
      .run();
    return Response.json({ inventory: { ...input, updatedAt: now } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update inventory' }, { status: 500 });
  }
}
