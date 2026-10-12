# Cloudflare migration

Source baseline: `e4f08eebcedd33eff362d015d0d3275259c4f128` (current Thirdweb/XMTP main), not the older Vercel production revision.

## Runtime and publishing

Node 22.22.0, vinext 1.1.0, React 19.2.8, Vite 8.3.4 and Wrangler 4.149.0 are pinned in the lockfile. Native Workers Builds should use root `/`, production `main`, build `npm run build`, deploy `npm run deploy`. `vercel.json` disables Git deployments so publishing the migration cannot replace the retained Vercel recovery deployment. No deployment credential belongs in GitHub.

`wrangler.jsonc` binds the provisioned production D1 `d11510fb-afa5-40c5-9ca7-0b1d26f5a6af`, has no custom-domain routes, disables previews, and keeps `READ_ONLY=true`. Its schema is initialized with no application rows. Staging D1 is `6958274c-ff30-4a5b-b5f5-34056ea44032`; actual private-data rehearsal uses separate D1 `1dd47184-f0fe-4bc7-8b16-f21ac8544d3e`. Never expose that rehearsal database through a Worker. Final source freeze/export/import and native Git publishing are still pending. Logs/traces are enabled without logging request bodies, wallet signatures, database rows or credentials.

Required configuration:

- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: public build variable for an owner-approved Thirdweb project that allows the target origin. The previous Vercel deployment only had a Privy ID. There is no invented default or automatic project creation.
- `NEXTAUTH_SECRET`: stable high-entropy Worker runtime secret, at least 32 characters. Missing/short secrets fail closed; builds need no signing secret. Keep the same secret across releases if sessions should survive.
- `NEXTAUTH_URL`: exact canonical HTTPS origin (production `https://w3rk.net`). Only loopback HTTP is accepted for local tests.
- `AUTH_ALLOWED_CHAIN_IDS`: preserves the existing Base, Base Sepolia and Ethereum list `8453,84532,1`.
- `READ_ONLY`: only the exact string `false` enables application writes and login challenge issuance/consumption. Reading existing sessions/public data remains available; signout remains available.

The NextAuth v4 compatibility scanner warns about API internals. The production Worker HTTP test proves CSRF, credentials, JWT session, signout and protected API handling with the pinned version. A narrow CommonJS default adapter fixes Vite 8 module wrapping. Thirdweb's transitive `rpc-websockets` and `pino` are aliased to their browser implementations to avoid Node transport modules in workerd. The validated Worker is approximately 6.1 MiB compressed, requiring the paid Worker size limit.

## Data and authorization

D1 uses typed prepared statements for the eight existing tables and an additional `auth_challenges` table. Original row IDs, nullable fields, unique constraints, relationships, cascades and UTC millisecond timestamps are preserved. Wallet addresses compare case-insensitively; the importer rejects pre-existing case collisions instead of merging accounts. User+listing/skill/endorsement, room+deduplicated participants, and message+room timestamp mutations use atomic D1 batches.

Only a signed NextAuth session authenticates API requests. An unsigned wallet header or connection state grants no permissions. SIWE requires the configured domain/origin/chain, a browser-bound random challenge, five-minute issued/expiry times and a valid signature. A conditional D1 update consumes each nonce once, including concurrent requests. Mutating application APIs also require same-origin requests; chat reads/writes require membership.

XMTP uses Thirdweb v5 signers and browser SDK 4.1.0 DMs addressed by resolved inbox ID, reuses conversations, and closes streams/client on cleanup. Decoded sender identity comes from inbox membership and nanosecond timestamps. Incoming network messages remain client-side and are never posted to D1 as the receiving user. App messages use a room-specific envelope; generic external DMs are not attributed to an app room. Navigation and session changes cancel stale reads and bind sends to one loaded room snapshot. Server persistence/authorization precedes external delivery; delivery failure remains distinct from save failure. Wallet-extension signing, Thirdweb origin configuration, live XMTP delivery, and two-wallet browser acceptance still need an owner-approved client ID and interactive verification.

The generated `/sw.js` replaces the old worker at the same scope, removes `w3rk-cache` and legacy Workbox caches, and only caches public static assets. It never caches navigation, API, authentication, profile or chat responses. The previous roadmap/placeholder functionality is unchanged.

## Recovery and cutover gates

1. Inventory source PostgreSQL schema and all eight tables before export. The repository's old migration creates only five tables; do not silently invent empty chat tables if live queries fail. Record absent tables explicitly and obtain an intentional mapping decision.
2. Export under a read-only repeatable-read transaction with `node scripts/transfer-data.mjs export-pg PRIVATE_OUTPUT`. Supply `DATABASE_URL` through process environment only. The tool writes mode 0600, refuses overwrites and prints only counts/digest. Keep output in an ignored directory with mode 0700. PostgreSQL dates are formatted in SQL to avoid local-timezone conversion.
3. `validate INPUT` rejects unexpected/missing fields, invalid values/timestamps, duplicate IDs/address collisions and broken references. `sql-d1 INPUT OUTPUT` produces inserts for an **empty**, already-migrated staging D1. The generated SQL rejects a nonempty application destination before importing any row. Import with scoped Wrangler; compare all eight counts and canonical SHA-256 after reading data back.
4. Before any chat writes, `sql-pg-source INPUT OUTPUT` restores into an **empty isolated PostgreSQL database** created using the original `prisma/migrations/20250905230200_/migration.sql`. It only targets the five source tables and refuses snapshots containing chat records. After chat writes, explicitly apply `scripts/postgres-chat-recovery-migration.sql` to that isolated schema, then use `sql-pg INPUT OUTPUT` for all eight tables. Alternatively, `scripts/postgres-recovery-schema.sql` creates a fresh eight-table recovery schema. Both PostgreSQL modes lock the selected tables and refuse a nonempty destination before one transactional import. Neither truncates or overwrites the original source.
5. Synthetic tests rehearse D1 to PostgreSQL with real local engines (Miniflare/workerd and embedded PostgreSQL/PGlite). Repeat with the actual private export and isolated staging before production changes.
6. Freeze **all** source writers before the final consistent export. Keep Cloudflare read-only through import/reconciliation. Remove that gate only after exact Git build/version, D1 identity, custom-domain TLS/routes and functional acceptance succeed. Do not dual-write.
7. If rolling back after Cloudflare writes, freeze Cloudflare first and export its current data. Restore into isolated PostgreSQL, compare data and deliberately promote/repoint the verified recovery database. Never point old Vercel code at the stale original database and lose new writes. Keep the original source and exports until recovery is verified.

## Verified data rehearsal (2026-10-12)

The source schema has five application tables: users 5, jobs 1, services 2, skills 1, endorsements 1. Chat tables are **absent**, not empty. The approved current-main mapping preserves all ten records exactly and deliberately initializes the three new chat tables empty. Private source inventory, mapped export, manifest and readback remain in the coordinator's ignored `work/vercel-migration/w3rk-recovery` directory (0700; files 0600).

Actual-data D1 readback and reverse restoration into the original five-table PostgreSQL schema have canonical SHA-256 `cc8597a3760cca9ec94e343d6996462434b05549c42453fc2d40acb67797865c`. Source column types/defaults/nullability and PK/FK constraints match the recovery schema. PostgreSQL 18 exposes NOT NULL catalog entries separately; those were compared through column nullability to accommodate the source version.

A separate local rehearsal applied the explicit chat schema migration and preserved three synthetic future chat rows alongside every real source row, with exact canonical equality. The source-only restore refused those new chat rows as intended. No source writes, writer freeze, production import, Worker publication or DNS cutover occurred during rehearsal.

## Local verification

```
npm ci
npm run cf:types
npm run typecheck
npm run test:unit
npm run build
npm run deploy:check
```

Use Node from `.nvmrc`. Local auth tests need a fresh random test-only secret and loopback `NEXTAUTH_URL` in ignored `.dev.vars`, `READ_ONLY=false`, and `wrangler d1 migrations apply DB --local`. Run the built Worker using `vite preview --host 127.0.0.1 --port 5193`; the preview config is under `dist/server`, so place the ignored test `.dev.vars` beside that generated config. Then run `node scripts/smoke-local-auth.mjs` and `node scripts/smoke-local-browser.mjs`. That script refuses non-loopback hosts and creates synthetic local records only. GitHub CI runs these local checks on Node 22 with an ephemeral test-only secret and has no deployment credentials. Test production HTTPS cookie flags again on isolated staging.
