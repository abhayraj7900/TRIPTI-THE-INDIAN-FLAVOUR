import { env } from 'cloudflare:workers';

import { isStaffRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!/^(menu|banners)\/[A-Za-z0-9._-]+$/.test(key)) return new Response('Not found', { status: 404 });
  const object = await env.ASSETS.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) return Response.json({ error: 'Staff sign-in required' }, { status: 401 });
    const form = await request.formData();
    const file = form.get('file');
    const folder = form.get('folder') === 'banners' ? 'banners' : 'menu';
    if (!(file instanceof File) || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'Choose an image smaller than 5 MB' }, { status: 400 });
    }
    const extension = file.name.split('.').pop()?.replace(/[^A-Za-z0-9]/g, '').toLowerCase() || 'jpg';
    const key = `${folder}/${crypto.randomUUID()}.${extension}`;
    await env.ASSETS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    return Response.json({ key, url: `/api/media?key=${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to upload image' }, { status: 500 });
  }
}
