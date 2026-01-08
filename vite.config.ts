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
            target: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent',
            changeOrigin: true,
            rewrite: (path) => `${path.replace('/api/generate', '')}?key=${env.GEMINI_API_KEY}`,
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
