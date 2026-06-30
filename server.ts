import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
