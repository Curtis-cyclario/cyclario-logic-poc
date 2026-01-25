## 2024-08-05 - Insecure Client-Side API Key Exposure in Vite

**Vulnerability:** A critical vulnerability was identified where the `GEMINI_API_KEY` was exposed to the client-side bundle. The `vite.config.ts` file used the `define` property to replace `process.env.GEMINI_API_KEY` with the raw secret, making it publicly accessible in the compiled JavaScript.

**Learning:** Using Vite's `define` feature for secrets is extremely dangerous and fundamentally insecure. It's equivalent to hardcoding the secret directly into the application's frontend code. This pattern must be strictly avoided.

**Prevention:** All handling of secrets and API keys must be done on the server-side. For development environments using Vite, the `server.proxy` feature is the correct and secure pattern. The client should make requests to a local API endpoint, and the proxy will securely forward the request to the actual API, injecting the key on the server-side, never exposing it to the browser. For production, a dedicated backend is required.