## 2024-08-05 - Insecure API Key Exposure in Vite Configuration
**Vulnerability:** The `GEMINI_API_KEY` was exposed to the client-side bundle via the `define` property in `vite.config.ts`.
**Learning:** Using Vite's `define` feature to expose environment variables containing secrets makes them publicly accessible in the compiled JavaScript. This is a common but critical mistake.
**Prevention:** Sensitive keys must never be exposed to the client. A backend proxy (or Vite's `server.proxy` for development) should be used to intercept client requests and inject the API key on the server-side before forwarding the request to the external service.
