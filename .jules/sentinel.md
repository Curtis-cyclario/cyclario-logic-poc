## 2024-08-05 - Exposed API Key in Vite Configuration
**Vulnerability:** The `GEMINI_API_KEY` was exposed to the client-side bundle through the `define` property in `vite.config.ts`.
**Learning:** The application was configured to inject secrets directly into the frontend code, making them publicly accessible. This is a common misconfiguration in Vite projects when developers are trying to access environment variables on the client-side.
**Prevention:** All API calls requiring secret keys must be proxied through a backend. The client should never directly handle secrets. For Vite, the `server.proxy` feature should be used during development to securely manage API keys.
