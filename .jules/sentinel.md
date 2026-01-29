## 2024-08-05 - The Vite Proxy Pitfall

**Vulnerability:** Critical exposure of `GEMINI_API_KEY` to the client-side bundle via Vite's `define` property in `vite.config.ts`.

**Learning:** A Vite development proxy (`server.proxy`) is an effective way to secure API keys during local development, but it is **not a production solution**. The proxy only exists for the dev server and does not work in a production build, which will break the application if it relies on those proxied endpoints. A proper fix requires a dedicated backend (e.g., a serverless function) to handle API calls in production.

**Prevention:** When using a dev proxy to handle secrets, always add a prominent warning comment in the configuration file, explicitly stating that the solution is for development only and that a production-ready backend is required before deployment.
