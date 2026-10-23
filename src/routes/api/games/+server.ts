import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { create, join, session } from '$lib/server/games/store';
export async function POST({ request, cookies }) {
  try {
    let token = cookies.get('player');
    if (!token) {
      token = randomUUID();
      cookies.set('player', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: new URL(request.url).protocol === 'https:',
        maxAge: 86400,
      });
    }
    const id = session(token);
    const body = await request.json();
    if (body.code !== undefined && !/^\d{6}$/.test(body.code))
      throw Error('Enter a six-digit lobby number.');
    return json(
      body.code === undefined
        ? create(id)
        : join(body.code, id, body.name ?? ''),
    );
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
