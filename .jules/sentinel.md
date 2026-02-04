## 2025-05-14 - Secure Gemini API Proxy Pattern
**Vulnerability:** Critical exposure of `GEMINI_API_KEY` to the client-side bundle via Vite's `define` configuration. This allowed any user to extract the secret key from the browser's source code.
**Learning:** Exposing secrets via `process.env` injection in Vite is a common but dangerous pattern. The `@google/genai` SDK on the client side necessitates this exposure if used directly.
**Prevention:** Use a Vite development proxy (`server.proxy`) to intercept API calls and inject the secret key on the server-side. Refactor client-side code to use `fetch` against the local proxy endpoint, removing the need for the SDK and the exposed secret.
