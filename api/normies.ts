import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add basic CORS headers for maximum resilience
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Robustly extract subpath and query parameters directly from req.url
  const fullUrl = req.url ?? '';
  const prefix = '/api/normies';
  const index = fullUrl.indexOf(prefix);
  const urlSubPath = index !== -1 ? fullUrl.substring(index + prefix.length) : fullUrl;

  // Split into path and query string parts
  const [pathPart, queryPart] = urlSubPath.split('?');
  const subPath = pathPart.startsWith('/') ? pathPart.substring(1) : pathPart;
  const queryString = queryPart ?? '';

  // Construct target URL ensuring clean slash separation
  const targetUrl = `https://api.normies.art/${subPath}${queryString ? `?${queryString}` : ''}`;

  try {
    console.log(`[Proxy] Fetching on-chain data: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

