# Sentinel Security Journal

## 2025-06-12 - Secret Exposure via Vite `define` Config
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the client-side bundle using Vite's `define` configuration. This hardcodes the secret directly into the compiled JavaScript, making it accessible to anyone who inspects the source code of the deployed application.

**Learning:** Vite's `define` property performs a global search-and-replace of the defined keys during the build process. While useful for public constants, it is extremely dangerous for secrets. Developers might use it thinking it works like server-side environment variables, but it actually embeds the values into the frontend code.

**Prevention:** Never use `define` or `import.meta.env.VITE_*` for sensitive secrets that must remain private. The correct architectural pattern for a frontend application is to use a backend proxy. For development, Vite's `server.proxy` can be used to securely inject keys into outgoing requests. For production, a proper server-side backend or edge function should handle the API calls and secret management.
