# Stockroom React frontend

This React app sends authentication and product requests to the LavaLust API. It does not connect to MySQL.

## Local development

1. From the LavaLust backend directory, start PHP's built-in server with LavaLust's front controller:

   ```powershell
   php -S 127.0.0.1:3000 -t public public/index.php
   ```

   The API will be available at `http://127.0.0.1:3000`. Using the front controller routes clean `/api/...` paths through LavaLust without modifying the backend CLI.

2. In the frontend directory, copy `.env.example` to `.env.local` if you need to override the API proxy settings. The defaults work with the backend command above.

3. Start the frontend:

   ```powershell
   npm run dev
   ```

   Open the Vite URL, normally `http://localhost:5173`. Login and product requests use the LavaLust API through the Vite `/api` proxy, with the backend session cookie included.

## Render frontend deployment

Create a Render Static Site for this project:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-lavalust-api-host>/api`

`VITE_API_BASE_URL` is public frontend configuration, not a secret. Never put database credentials or API signing secrets in `VITE_` variables.

On the LavaLust Render service, set `API_ALLOWED_ORIGINS` to the exact frontend origin, such as `https://<your-frontend-host>`, and set `APP_ENV=production`. Keep Aiven connection values and API signing keys only in the backend service environment. The API library configures secure, cross-origin session cookies when `APP_ENV=production`; optionally override the SameSite value with `SESSION_COOKIE_SAMESITE`.
