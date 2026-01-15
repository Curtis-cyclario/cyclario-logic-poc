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
          // 🛡️ SENTINEL: This proxy is a security measure to prevent the API key from being exposed in the client-side code.
          // Requests to /api/generate are forwarded to the Google Generative AI API, with the API key injected server-side.
          // This is a development-only solution. For production, a proper backend is required.
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
