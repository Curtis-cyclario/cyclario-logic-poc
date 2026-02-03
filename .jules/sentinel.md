# Sentinel Journal - Critical Security Learnings

## 2026-02-03 - Fixing Secret Exposure in Vite
**Vulnerability:** The `GEMINI_API_KEY` was exposed to the client-side bundle via the `define` property in `vite.config.ts`. This allowed anyone with access to the frontend assets to extract the API key.
**Learning:** Using `define` to inject environment variables into the client bundle is dangerous for secrets. Vite's `server.proxy` provides a secure way to handle API keys during development by intercepting client requests and injecting the key on the server side.
**Prevention:** Never use `define` or `import.meta.env` with `VITE_` prefixes for sensitive secrets. Always use a backend or a development proxy to handle secret-bearing API calls.
