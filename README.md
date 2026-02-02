<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19hnRgwY_fZ9VS68oCFuAH5HDu14uWcrP

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
   **Note:** This key is used by the Vite development proxy and is not exposed to the client bundle.
3. Run the app:
   `npm run dev`

### Security Note
This application uses a secure development proxy in `vite.config.ts` to handle the `GEMINI_API_KEY`. For production deployments, you must implement a server-side proxy or backend endpoint to securely handle API calls and protect your secret key.
