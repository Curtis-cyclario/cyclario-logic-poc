import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // SENTINEL-NOTE: For production, security headers (e.g., CSP, X-Frame-Options)
      // should be configured at the hosting provider level (e.g., Netlify, Vercel)
      // as they cannot be reliably set through Vite's build process.
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
