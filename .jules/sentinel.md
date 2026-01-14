## 2024-07-25 - Exposed API Key in Vite Configuration

**Vulnerability:** A critical vulnerability was identified where the `GEMINI_API_KEY` was exposed to the client-side bundle. The `vite.config.ts` file used the `define` property to make the key available as `process.env.GEMINI_API_KEY`, which embeds the key directly into the compiled JavaScript, making it publicly accessible.

**Learning:** Using Vite's `define` feature for secrets is insecure. It is designed for non-sensitive configuration, and any variables passed through it become part of the client-side code, which can be easily inspected by users.

**Prevention:** To prevent secret exposure, a server-side proxy must be used. For local development, Vite's `server.proxy` can be configured to intercept client-side API requests and forward them to the actual API endpoint, injecting the secret key on the server-side. This ensures the key never leaves the server environment.
