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
          // IMPORTANT: This proxy is a development-only solution to avoid exposing the API key.
          // In a production environment, this logic should be handled by a proper backend server.
          '/api/generate': {
            target: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${env.GEMINI_API_KEY}`,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/generate/, ''),
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
