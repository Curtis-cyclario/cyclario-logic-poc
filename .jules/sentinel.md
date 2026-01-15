## 2024-08-05 - Insecure API Key Exposure in Vite Configuration

**Vulnerability:** A critical vulnerability was identified where the `GEMINI_API_key` was directly exposed to the client-side bundle. The `vite.config.ts` file used the `define` property to make the environment variable available as `process.env.GEMINI_API_KEY`, which allowed the key to be embedded in the compiled JavaScript.

**Learning:** This vulnerability existed because the original implementation prioritized direct API calls from the frontend using the `@google/genai` SDK, which required the key to be available on the client. This is a common anti-pattern in modern web development, as it exposes sensitive credentials to anyone inspecting the site's code.

**Prevention:** To prevent this from happening again, all future integrations with external APIs that require secret keys must be done through a server-side proxy. The `vite.config.ts` file has been updated to use a proxy for API requests, which keeps the key on the server and out of the client-side bundle. Future developers should follow this pattern for any new API integrations.