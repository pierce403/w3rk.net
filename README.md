# w3rk.net — Next.js starter

A tiny, deploy‑ready Next.js (App Router) shell for **w3rk.net**.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **New Project → Import Git Repository** and select your repo.
3. Framework preset: **Next.js**. Leave defaults.  
4. Deploy. Every push creates a new preview; the default branch becomes **Production**.

Docs: Next.js on Vercel, Git deploys, and custom domains:
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/git
- https://vercel.com/docs/domains/working-with-domains/add-a-domain

## Health check

`GET /api/health` returns `{ ok: true }`

## Next steps

- Replace placeholder pages in `app/` with your real routes.
- Add Env vars via Vercel Project Settings if needed later.
- If you add an API or DB, consider Vercel KV/Postgres/Blob or your own infra.
