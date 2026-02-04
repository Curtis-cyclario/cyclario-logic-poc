<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19hnRgwY_fZ9VS68oCFuAH5HDu14uWcrP

## Run Locally

**Prerequisites:**  Node.js, pnpm


1. Install dependencies:
   `pnpm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `pnpm dev`

## Security Note

This application uses a Vite development proxy to securely handle the `GEMINI_API_KEY`. This ensures the key is never exposed to the client-side bundle during development.

**Important:** The development proxy is only for local use. For production deployments, you must implement a proper backend proxy to securely handle API keys and sensitive operations.
