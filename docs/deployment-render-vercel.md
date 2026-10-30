# Render backend + Vercel frontend deployment

The repository root `render.yaml` provisions the Spring Boot API, PostgreSQL,
and Redis-compatible Key Value service in Render's Frankfurt region.

## 1. Create the backend

1. In Render, choose **New > Blueprint**.
2. Connect `yigitcnkzlts/logiway-control-center`.
3. Keep `render.yaml` as the Blueprint path and apply it.
4. Wait until `https://<service>.onrender.com/actuator/health` returns `UP`.

Render generates the JWT, encryption, and database secrets. Do not copy them
into the repository. The free plan is intended for initial validation and can
sleep or have capacity limits.

## 2. Connect Vercel

Set the following variables in the Vercel project for Production and Preview:

```text
VITE_GUC_API_URL=https://<service>.onrender.com
VITE_USE_MOCK_DATA=false
VITE_API_TIMEOUT_MS=30000
```

Redeploy the frontend after changing a `VITE_` variable because Vite embeds
these values at build time.

## 3. Verify

1. Open `/actuator/health` on the API.
2. Register a new account from the frontend; production has no default admin.
3. Sign in and confirm `/api/v1/me` succeeds.
4. Create and list a load, then sign out and confirm the session is cleared.

## Before real production traffic

- Move uploads from the container filesystem to object storage.
- Upgrade sleeping/free services and configure database backups.
- Restrict CORS to the final production and required preview domains.
- Configure SMTP, monitoring, error tracking, and a staging end-to-end test.
