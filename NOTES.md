# Migration notes

## 2026-10-12

- Cloned current main `e4f08eebcedd33eff362d015d0d3275259c4f128` into the isolated migration checkout; no AGENTS existed. Owner selected this Thirdweb/XMTP branch over older live Privy code.
- Upstream vinext compatibility scan: 86%, one explicit NextAuth warning; `next/*` imports supported. Installed upstream migration skill locally and followed the Cloudflare App Router setup.
- Implemented typed native D1, strict SIWE/NextAuth session authorization, Thirdweb v5 hooks, XMTP identity/conversation fixes, maintenance gate, safe service worker and transfer/recovery tooling. Vercel Git deployments disabled in configuration before any future push.
- Node 22.22.0 production build and TypeScript pass. Runtime test uses production output under workerd: CSRF, unsigned-header denial, login, session, write APIs, chat, origin rejection, nonce replay denial, logout and private-read denial pass.
- The first workerd test caught CommonJS default wrapping in NextAuth credentials; narrow adapter fixed it. Development bundling needed browser `rpc-websockets` and `pino` entries; Node transports cannot run under workerd. Local development render returns 200 after both aliases.
- Reverse PostgreSQL rehearsal caught a real seven-hour date shift from Node's local timezone parsing TIMESTAMP(3). Export now formats timestamps in SQL; synthetic data tests verify exact canonical equality.
- Chromium production render/navigation has no page errors; service worker upgrade removes legacy w3rk/workbox caches and preserves unrelated caches. Local wallet configuration is intentionally absent pending an approved public client ID.
- Read-only maintenance HTTP checks pass: public reads 200, application POST and nonce issuance 503. Wrangler dry-run passes; compressed Worker is about 6.1 MiB and requires the paid size limit.
- Root coordinator authorized read-only real source inventory/export and isolated D1/reverse PostgreSQL rehearsal after the code commit. Root retains remote publishing, source-writer freeze, DNS and cutover. No push/deployment/source-data mutation performed here. See `docs/cloudflare-migration.md` for gates and commands.
