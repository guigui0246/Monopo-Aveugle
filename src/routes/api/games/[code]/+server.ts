import { json } from '@sveltejs/kit';
import { get, dispatch, identity } from '$lib/server/games/store';
import { view } from '$lib/server/games/engine';
export function GET({ params, cookies, url }) {
  try {
    const id = identity(cookies.get('player') ?? '');
    const g = get(params.code, id);
    if (url.searchParams.has('replay')) {
      if (g.status !== 'ended' || (!g.settings.replay && g.host !== id))
        throw Error('Replay download is unavailable.');
      return json(
        {
          settings: g.settings,
          board: g.board,
          players: g.players,
          events: g.log,
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="monopo-${g.code}.json"`,
          },
        },
      );
    }
    return json(
      { ...view(g, id), me: id },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
export async function POST({ params, cookies, request }) {
  try {
    return json(
      dispatch(
        params.code,
        identity(cookies.get('player') ?? ''),
        await request.json(),
      ),
    );
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
