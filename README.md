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
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

## 🛡️ Security Note

This project uses a Vite proxy to securely manage the `GEMINI_API_KEY` during local development. The key is injected on the server-side, preventing it from being exposed in the client-side code. For production, a similar server-side proxy approach is required.
