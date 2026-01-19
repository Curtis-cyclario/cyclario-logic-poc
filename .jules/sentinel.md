## 2024-08-16 - Vite `define` Property Leaks Secrets

**Vulnerability:** The `vite.config.ts` file used the `define` property to expose the `GEMINI_API_key` directly to the client-side bundle. This is a critical vulnerability that makes the secret key visible to anyone inspecting the application's source code.

**Learning:** The `define` property in Vite is a powerful feature, but it should never be used for secrets. It's a direct replacement of the key with the value in the bundled code, making it a text-based substitution.

**Prevention:** For handling secrets in a Vite application, always use a server-side proxy during development. This ensures that the secret key is never exposed to the client-side bundle. For production, a proper server-side backend is required to securely handle API keys.
