import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { path, ...query } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : (path ?? '');

  const queryString = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map(v => [key, v]) : [[key, value as string]]
    )
  ).toString();

  const targetUrl = `https://api.normies.art/${apiPath}${queryString ? `?${queryString}` : ''}`;

  try {
    console.log(`[Proxy] Fetching on-chain data: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AtlasProxy/1.0)'
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] Target API returned status ${response.status} for ${targetUrl}`);
      const text = await response.text();
      res.status(response.status).send(text);
      return;
    }

    const contentType = response.headers.get('content-type') || '';

    // Cache at the edge briefly - matches the API's own short cache windows
    // (most Normies endpoints are max-age=15-300s). Adjust per-route if you
    // want to be more precise using the cache table in the API docs.
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');

    if (contentType.includes('application/json')) {
      const json = await response.json();
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(json);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Type', contentType);
      res.status(200).send(buffer);
    }
  } catch (error: any) {
    console.error('[Proxy] Error fetching from target API:', error);
    res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
}
