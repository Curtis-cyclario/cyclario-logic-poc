## 2024-08-05 - Insecure API Key Exposure in Vite Configuration

**Vulnerability:** The `vite.config.ts` file was using the `define` property to expose the `GEMINI_API_KEY` directly to the client-side bundle. This makes the key accessible to anyone inspecting the application's source code, posing a significant security risk.

**Learning:** Exposing API keys or other secrets to the client-side is a critical vulnerability. The `define` property in `vite.config.ts` should not be used for secrets.

**Prevention:** To prevent this in the future, all API calls that require a secret key must be proxied through a backend or a secure serverless function. The Vite development server's proxy feature can be used for local development, but a proper backend is required for production. Never use `define` or any other method to expose secrets to the client.
