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
          '/api/generate': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/generate/, '/v1/models/gemini-3-pro-preview:generateContent'),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                proxyReq.setHeader('x-goog-api-key', env.GEMINI_API_KEY);
                proxyReq.setHeader('Content-Type', 'application/json');

                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                req.on('end', () => {
                  try {
                    const requestBody = JSON.parse(body);
                    const newBody = {
                      contents: [{
                        parts: [{ text: requestBody.prompt }]
                      }]
                    };
                    const finalBody = JSON.stringify(newBody);
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(finalBody));
                    proxyReq.write(finalBody);
                    proxyReq.end();
                  } catch (e) {
                    console.error('Error parsing request body:', e);
                    res.statusCode = 400;
                    res.end('Error parsing request body');
                  }
                });
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
