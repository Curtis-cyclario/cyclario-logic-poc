import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 🛡️ SENTINEL VULNERABILITY REPORT 🛡️
    // ===================================
    // CRITICAL: API Key Exposure
    //
    // The original configuration used Vite's `define` property to expose
    // the GEMINI_API_KEY directly to the client-side code. This is a
    // severe security vulnerability, as it embeds the secret API key
    // into the public JavaScript bundle, making it accessible to anyone.
    //
    // To mitigate this, the `define` block has been removed.
    //
    // **ACTION REQUIRED FOR PRODUCTION:**
    // To use the Gemini API securely, you MUST implement a server-side
    // proxy. The client should make requests to your backend, which then
    // securely attaches the API key and forwards the request to the
    // Google GenAI API. This ensures the key never leaves your server.
    //
    // The previous use of `server.proxy` is a development-only feature
    // and WILL NOT work in a production build.
    // ===================================

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
