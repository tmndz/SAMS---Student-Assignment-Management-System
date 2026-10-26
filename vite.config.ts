import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function canvasProxyPlugin(): Plugin {
  return {
    name: 'canvas-proxy-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/canvas-proxy')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing url query parameter' }));
            return;
          }
          try {
            const authHeader = req.headers['authorization'];
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (authHeader) headers['Authorization'] = authHeader;
            const targetRes = await fetch(targetUrl, { headers });
            res.statusCode = targetRes.status;
            res.setHeader('Content-Type', targetRes.headers.get('content-type') || 'application/json');
            const data = await targetRes.text();
            res.end(data);
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), canvasProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
