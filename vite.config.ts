import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 🚨 CRITICAL SECURITY WARNING 🚨
        // This configuration exposes the GEMINI_API_KEY to the client-side bundle.
        // This is a severe security vulnerability. The API key will be publicly visible
        // in the compiled JavaScript, allowing anyone to use it.
        //
        // This application MUST be refactored to use a secure server-side proxy
        // or a backend-for-frontend (BFF) pattern to handle API calls in a production
        // environment. The current implementation is NOT safe for production use.
        // A Vite proxy (`server.proxy`) is suitable for development but will NOT work
        // in a production build.
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
