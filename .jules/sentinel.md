## 2024-08-05 - Mitigated Critical Client-Side API Key Exposure

**Vulnerability:** A critical security vulnerability was identified where the `GEMINI_API_KEY` was directly exposed to the client-side bundle. The `vite.config.ts` file used the `define` property to replace `process.env.GEMINI_API_KEY` with the actual secret key, making it publicly accessible in the compiled JavaScript.

**Learning:** This vulnerability existed because the original implementation prioritized direct API access from the frontend without considering the security implications. Vite's `define` feature, while useful, can be easily misused to create severe security risks if not handled with care.

**Prevention:** To prevent this vulnerability in the future, all API calls requiring secret keys must be routed through a backend proxy. For development, Vite's `server.proxy` is an effective solution. For production, a dedicated backend service is necessary. Never use the `define` property in `vite.config.ts` to expose secrets to the client.
