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
            target: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${env.GEMINI_API_KEY}`,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/generate/, ''),
          }
        }
      },
      plugins: [react()],
      // SECURITY FIX: Removed 'define' block that exposed GEMINI_API_KEY to the client bundle.
      // Use the development proxy above for secure API calls during local development.
      // NOTE: For production, a proper backend proxy is required to handle the API key securely.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
