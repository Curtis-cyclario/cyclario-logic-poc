import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/gemini': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/gemini/, '/v1beta/models/gemini-3-pro-preview:generateContent'),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req) => {
                proxyReq.setHeader('x-goog-api-key', env.GEMINI_API_KEY);
                proxyReq.setHeader('Content-Type', 'application/json');

                if (req.body) {
                  const bodyData = JSON.stringify(req.body);
                  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                  proxyReq.write(bodyData);
                }
              });
            }
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
