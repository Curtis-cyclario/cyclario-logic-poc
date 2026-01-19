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
          // SECURE PROXY: This proxy forwards requests from the client to the Google GenAI API,
          // securely adding the API key on the server-side. This is a security best practice
          // to avoid exposing the GEMINI_API_KEY to the client-side bundle, which is a
          // critical vulnerability. The proxy is only for development and will not work in
          // a production build. A proper server-side backend is required for production.
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
