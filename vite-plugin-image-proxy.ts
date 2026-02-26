import { Plugin } from 'vite';

export function imageProxyPlugin(): Plugin {
  return {
    name: 'image-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/proxy-image/')) {
          try {
            const encodedUrl = req.url.substring('/proxy-image/'.length);
            const targetUrl = decodeURIComponent(encodedUrl);
            
            if (!targetUrl || !targetUrl.startsWith('http')) {
              res.statusCode = 400;
              res.end('Invalid URL');
              return;
            }

            const imageResponse = await fetch(targetUrl);
            if (!imageResponse.ok) {
              res.statusCode = imageResponse.status;
              res.end(`Failed to fetch image: ${imageResponse.status}`);
              return;
            }

            const contentType = imageResponse.headers.get('content-type') || 'image/png';
            const buffer = Buffer.from(await imageResponse.arrayBuffer());

            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(buffer);
          } catch (error: any) {
            console.error('Image proxy error:', error);
            res.statusCode = 500;
            res.end(`Proxy error: ${error.message}`);
          }
        } else {
          next();
        }
      });
    },
  };
}
