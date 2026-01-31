## 2026-01-31 - Secret Exposure via Vite Define
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the client-side bundle via the `define` property in `vite.config.ts`.
**Learning:** Using `define` to inject environment variables makes them available in the client-side bundle, which is insecure for sensitive secrets like API keys.
**Prevention:** Use a backend proxy for API calls that require secrets. For development, Vite's `server.proxy` can be used to inject secrets into requests before they are forwarded to the external API.
