import { Plugin } from 'vite';
import https from 'https';

export function videoProxyPlugin(): Plugin {
  return {
    name: 'video-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/proxy-video/')) {
          try {
            const encodedUrl = req.url.substring('/proxy-video/'.length);
            const targetUrl = decodeURIComponent(encodedUrl);
            
            if (!targetUrl || !targetUrl.startsWith('http')) {
              res.statusCode = 400;
              res.end('Invalid URL');
              return;
            }

            console.log(`[Video Proxy] ${req.method} ${targetUrl}`);

            const urlObj = new URL(targetUrl);
            const options: https.RequestOptions = {
              method: req.method as any,
              hostname: urlObj.hostname,
              port: urlObj.port || 443,
              path: urlObj.pathname + urlObj.search,
              headers: {
                ...req.headers as any,
                host: urlObj.hostname,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://open.bigmodel.cn/',
                'Origin': 'https://open.bigmodel.cn',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
              } as any,
            };

            const proxyReq = https.request(options, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, {
                'Content-Type': proxyRes.headers['content-type'] || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
              });

              proxyRes.pipe(res);
            });

            proxyReq.on('error', (error) => {
              console.error('Video proxy error:', error);
              res.statusCode = 500;
              res.end(`Proxy error: ${error.message}`);
            });

            if (req.method !== 'GET') {
              req.pipe(proxyReq);
            } else {
              proxyReq.end();
            }
          } catch (error: any) {
            console.error('Video proxy error:', error);
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
