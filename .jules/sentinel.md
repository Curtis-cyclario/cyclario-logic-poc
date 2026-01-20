## 2024-08-01 - Vite `define` Exposes Secrets to Client

**Vulnerability:** The Vite configuration (`vite.config.ts`) used the `define` property to expose the `GEMINI_API_KEY` environment variable as a global JavaScript variable (`process.env.GEMINI_API_KEY`). This made the secret API key directly accessible to anyone inspecting the client-side JavaScript bundle, posing a significant security risk.

**Learning:** The `define` feature in Vite is a powerful tool for injecting compile-time constants, but it should never be used for secrets. Any variable passed through `define` is literally embedded into the application's source code, making it public. The correct approach for handling API keys in a client-side application is to use a server-side proxy that can securely manage and inject the key into API requests, without ever exposing it to the browser.

**Prevention:** All access to APIs requiring secret keys must be routed through a dedicated, server-side proxy. The client should only ever interact with the proxy endpoint, never the API directly. The `define` property in `vite.config.ts` should be reserved for non-sensitive, compile-time configuration only. This architectural pattern must be enforced for all future API integrations.

## 2024-08-01 - Vite Proxy is Development-Only

**Vulnerability:** A security fix was implemented using Vite's `server.proxy` to protect an API key. While this works in the development environment, it does not work in production. The Vite development server is not present in a production build, so the proxy is non-functional, breaking all API calls.

**Learning:** Vite's `server.proxy` is a development-time convenience and not a solution for production environments. A production-ready application requires a proper backend or serverless function to handle proxying and API key management.

**Prevention:** When implementing a proxy for API calls, a production-ready solution must be considered from the start. For this project, this means deploying a serverless function or a small backend service alongside the frontend to handle API requests. The development-only nature of Vite's proxy should be clearly documented in the code to avoid accidental deployment of a non-functional solution.
