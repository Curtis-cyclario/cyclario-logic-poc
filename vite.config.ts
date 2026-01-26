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
          // 🛡️ SENTINEL-SECURED PROXY
          // This proxy is a development-only solution to prevent exposing the GEMINI_API_KEY on the client.
          // It intercepts requests to /api/generate and forwards them to the Google API, injecting the key.
          // ⚠️ IMPORTANT: This will NOT work in a production build. A proper server-side backend (e.g., a serverless function)
          // is required to securely handle the API key in a production environment.
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
