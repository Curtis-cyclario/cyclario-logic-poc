## 2025-05-15 - Hardcoded API Key Exposure in Client Bundle
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the client-side bundle via Vite's `define` property in `vite.config.ts`. This made the secret API key accessible to anyone inspecting the compiled JavaScript in the browser.

**Learning:** Using `define` or `import.meta.env` with secrets in Vite (or similar bundlers) results in those secrets being baked into the static assets at build time. This is a common but critical security mistake in frontend-only applications.

**Prevention:** Never use `define` or `VITE_` prefixed environment variables for sensitive secrets that should remain server-side. Instead, use a backend proxy (like Vite's `server.proxy` for development or a dedicated server for production) to intercept requests and inject the secrets securely before forwarding to the third-party API.
