import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  let cachedLastSalePrice: number | null = null;

  // Market statistics route fetching real-time OpenSea or Reservoir data
  app.get("/api/market/stats", async (req, res) => {
    try {
      // Default live estimation values matching actual Base market
      let floorPrice = 0.18;
      let volume24h = 0.45;
      let listedCount = 350;
      let ownerCount = 3250;
      let lastSalePrice = cachedLastSalePrice;
      let lastSaleTokenId = "512";
      let lastSaleImage = "https://api.normies.art/normie/512/image.png";
      let isReal = false;

      const openseaKey = (req.headers['x-opensea-api-key'] as string) || process.env.OPENSEA_API_KEY;

      if (openseaKey) {
        console.log(`[Proxy] Fetching market stats from OpenSea with API Key`);
        try {
          const osUrl = 'https://api.opensea.io/api/v2/collections/normies/stats';
          const resp = await fetch(osUrl, {
            headers: {
              'Accept': 'application/json',
              'X-API-KEY': openseaKey
            }
          });
          if (resp.ok) {
            const osData = await resp.json();
            console.log(`[Proxy] OpenSea stats raw data:`, JSON.stringify(osData));
            
            // In OpenSea v2, collections stats are nested under 'total'
            const total = osData.total || {};
            
            const fp = total.floor_price !== undefined ? total.floor_price : osData.floor_price;
            if (fp !== undefined && fp !== null) {
              floorPrice = parseFloat(fp);
            }
            
            const owners = total.num_owners !== undefined ? total.num_owners : osData.num_owners;
            if (owners !== undefined && owners !== null) {
              ownerCount = parseInt(owners);
            }
            
            // Parse 24H volume from intervals
            if (osData.intervals && Array.isArray(osData.intervals)) {
              const dayInterval = osData.intervals.find((i: any) => i.interval === 'one_day');
              if (dayInterval && dayInterval.volume !== undefined) {
                volume24h = parseFloat(dayInterval.volume);
              }
            }
            isReal = true;
            console.log(`[Proxy] OpenSea stats parsed: Floor=${floorPrice}, Owners=${ownerCount}, Vol24h=${volume24h}`);
          } else {
            console.warn(`[Proxy] OpenSea stats response error: ${resp.status}`);
          }
        } catch (err) {
          console.warn(`[Proxy] OpenSea stats fetch failed, falling back to Reservoir:`, err);
        }
      }

      // Fetch from Reservoir Base API if OpenSea stats couldn't be loaded or no key is present
      if (!isReal) {
        console.log(`[Proxy] Fetching market stats from Reservoir Base API`);
        try {
          const rUrl = 'https://api-base.reservoir.tools/collections/v7?id=0x90205A3A3b2A6adF410B5d1A94b5A6D5c67890f5';
          const rResp = await fetch(rUrl, { headers: { 'Accept': 'application/json' } });
          if (rResp.ok) {
            const rData = await rResp.json();
            if (rData.collections && rData.collections.length > 0) {
              const coll = rData.collections[0];
              if (coll.floorAsk?.price?.amount?.decimal !== undefined) {
                floorPrice = coll.floorAsk.price.amount.decimal;
              }
              if (coll.ownerCount !== undefined) {
                ownerCount = parseInt(coll.ownerCount);
              }
              if (coll.onSaleCount !== undefined) {
                listedCount = parseInt(coll.onSaleCount);
              }
              if (coll.volume?.['1day'] !== undefined) {
                volume24h = parseFloat(coll.volume['1day']);
              }
              isReal = true;
              console.log(`[Proxy] Reservoir Base stats parsed: Floor=${floorPrice}, Owners=${ownerCount}, Vol24h=${volume24h}, Listed=${listedCount}`);
            }
          }
        } catch (rErr) {
          console.warn(`[Proxy] Reservoir Base stats fetch failed:`, rErr);
        }
      }

      res.json({
        floorPrice,
        volume24h: isReal ? volume24h : null,
        listedCount,
        ownerCount,
        lastSalePrice,
        lastSaleTokenId,
        lastSaleImage,
        isReal
      });
    } catch (error: any) {
      console.error(`[Proxy] Error in market/stats:`, error);
      res.status(500).json({ error: error.message || 'Internal proxy error' });
    }
  });

  // Real-time events endpoint proxying to OpenSea Events API or Reservoir Base API
  app.get("/api/market/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      let events: any[] = [];
      let isReal = false;

      const openseaKey = (req.headers['x-opensea-api-key'] as string) || process.env.OPENSEA_API_KEY;

      if (openseaKey) {
        console.log(`[Proxy] Fetching collection events from OpenSea with API Key`);
        try {
          const url = `https://api.opensea.io/api/v2/events/collection/normies?limit=${limit}`;
          const resp = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'X-API-KEY': openseaKey
            }
          });
          if (resp.ok) {
            const data = await resp.json();
            const osEvents = data.asset_events || [];
            console.log(`[Proxy] Successfully fetched ${osEvents.length} events from OpenSea`);
            
            events = osEvents.map((ev: any, index: number) => {
              const normieId = ev.nft?.identifier || "1";
              let type = 'normie_listing';
              let title = 'Normie Listed';

              const et = String(ev.event_type || '').toLowerCase();
              if (et === 'sale' || et === 'item_sold' || et === 'order_filled') {
                type = 'normie_sale';
                title = 'Normie Sold';
              } else if (et === 'transfer' || et === 'item_transferred') {
                type = 'normie_transferred';
                title = 'Normie Transferred';
              } else if (et === 'listing' || et === 'item_listed' || et === 'order_created') {
                type = 'normie_listing';
                title = 'Normie Listed';
              }

              // Extract sender/seller
              const fromVal = ev.seller || ev.from_address || ev.maker || '0xunknown';
              const parsedFrom = typeof fromVal === 'object' ? (fromVal.address || '0xunknown') : fromVal;

              // Extract receiver/buyer
              const toVal = ev.buyer || ev.to_address || ev.taker || '0xunknown';
              const parsedTo = typeof toVal === 'object' ? (toVal.address || '0xunknown') : toVal;
              
              let price = 0.18;
              if (ev.payment) {
                const quantity = ev.payment.quantity ? parseFloat(ev.payment.quantity) : 0;
                const decimals = ev.payment.decimals ?? 18;
                if (quantity > 0) {
                  price = quantity / Math.pow(10, decimals);
                }
              } else if (ev.price) {
                const value = ev.price.value ? parseFloat(ev.price.value) : (typeof ev.price === 'number' ? ev.price : 0);
                const decimals = ev.price.decimals ?? 18;
                if (value > 0) {
                  price = value / Math.pow(10, decimals);
                }
              }
              
              const timestamp = ev.event_timestamp 
                ? (typeof ev.event_timestamp === 'number' ? ev.event_timestamp * 1000 : new Date(ev.event_timestamp).getTime())
                : Date.now() - index * 300000;
                
              const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
              let timeAgo = 'Just now';
              if (secondsAgo >= 86400) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
              else if (secondsAgo >= 3600) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
              else if (secondsAgo >= 60) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
              
              if (type === 'normie_sale') {
                cachedLastSalePrice = price;
              }

              return {
                id: ev.order_hash || ev.transaction || `os_event_${index}`,
                type,
                title,
                normieName: ev.nft?.name || `Normie #${normieId}`,
                normieId,
                userAddress: parsedFrom,
                toAddress: parsedTo !== '0xunknown' ? parsedTo : undefined,
                timeAgo,
                timestamp,
                price: parseFloat(price.toFixed(3)),
                isReal: true
              };
            });
            isReal = true;
          } else {
            console.warn(`[Proxy] OpenSea events response error: ${resp.status}`);
          }
        } catch (err) {
          console.warn(`[Proxy] OpenSea events fetch failed, falling back to Reservoir:`, err);
        }
      }

      // Fetch from Reservoir Base API if OpenSea events couldn't be loaded or no key is present
      if (events.length === 0) {
        try {
          console.log(`[Proxy] Fetching real sales from Reservoir Base API`);
          const rSalesUrl = `https://api-base.reservoir.tools/sales/v4?collection=0x90205a3a3b2a6adf410b5d1a94b5a6d5c67890f5&limit=${limit}`;
          const rResp = await fetch(rSalesUrl, { headers: { 'Accept': 'application/json' } });
          if (rResp.ok) {
            const rData = await rResp.json();
            if (rData.sales && rData.sales.length > 0) {
              events = rData.sales.map((sale: any, index: number) => {
                const normieId = sale.token?.tokenId || "1";
                const price = sale.price?.amount?.decimal || 0.18;
                const timestamp = sale.timestamp ? sale.timestamp * 1000 : Date.now() - index * 600000;
                
                const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
                let timeAgo = 'Just now';
                if (secondsAgo >= 86400) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
                else if (secondsAgo >= 3600) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
                else if (secondsAgo >= 60) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;

                if (index === 0) {
                  cachedLastSalePrice = price;
                }

                return {
                  id: sale.id || `res_sale_${index}`,
                  type: 'normie_sale',
                  title: 'Normie Sold',
                  normieName: sale.token?.name || `Normie #${normieId}`,
                  normieId,
                  userAddress: sale.from || '0xunknown',
                  toAddress: sale.to,
                  timeAgo,
                  timestamp,
                  price: parseFloat(price.toFixed(3)),
                  isReal: true
                };
              });
              isReal = true;
              console.log(`[Proxy] Successfully fetched ${events.length} real sales from Reservoir`);
            }
          }
        } catch (err) {
          console.warn(`[Proxy] Reservoir sales fetch failed:`, err);
        }
      }

      // Fallback: If both fail, return an empty array indicating no active live market events are available at this moment.
      if (events.length === 0) {
        console.log(`[Proxy] No real market events retrieved from OpenSea or Reservoir, returning empty array.`);
        events = [];
      }

      res.json(events);
    } catch (error: any) {
      console.error(`[Proxy] Error in market/events:`, error);
      res.status(500).json({ error: error.message || 'Internal proxy error' });
    }
  });

  // Server-side CORS-bypass proxy for Normies Art API
  app.get("/api/normies/*", async (req, res) => {
    try {
      // Get the path after /api/normies/
      const apiPath = req.params[0];
      // Get the query string
      const queryString = req.url.split('?')[1] || '';
      const targetUrl = `https://api.normies.art/${apiPath}${queryString ? '?' + queryString : ''}`;
      
      console.log(`[Proxy] Fetching on-chain data: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      if (!response.ok) {
        console.error(`[Proxy] Target API returned status ${response.status} for ${targetUrl}`);
        res.status(response.status).send(await response.text());
        return;
      }

      // Check content type to see if it's JSON or something else (like an image)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        res.setHeader('Content-Type', 'application/json');
        res.json(json);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
      }
    } catch (error: any) {
      console.error(`[Proxy] Error fetching from target API:`, error);
      res.status(500).json({ error: error.message || 'Internal proxy error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
