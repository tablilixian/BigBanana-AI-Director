import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { imageProxyPlugin } from './vite-plugin-image-proxy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // BigModel API 代理
          '/bigmodel': {
            target: 'https://open.bigmodel.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/bigmodel/, ''),
          },
        },
      },
      plugins: [react(), imageProxyPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.ANTSK_API_KEY),
        'process.env.ANTSK_API_KEY': JSON.stringify(env.ANTSK_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
