# Sentinel Journal - Critical Security Learnings

This journal documents critical security vulnerabilities found and fixed in this codebase.

## 2025-05-15 - Fix GEMINI_API_KEY exposure
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the client-side bundle via the `define` property in `vite.config.ts`. This exposed the secret key to any user of the application.
**Learning:** Using `define` or `import.meta.env` for secrets in Vite (or similar bundlers) makes them available in the client-side source code. Secrets should never be part of the frontend build.
**Prevention:** Use a backend proxy (even if it's just the Vite dev server proxy for local development) to append secrets to API requests on the server-side, keeping them out of the client-side bundle.
