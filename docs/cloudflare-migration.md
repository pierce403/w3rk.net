# Cloudflare migration

Source baseline: `e4f08eebcedd33eff362d015d0d3275259c4f128` (the newer application and XMTP features). The owner subsequently selected the existing production Privy application for wallet connection, preserving the newer migration fixes.

## Runtime and publishing

Node 22.22.0 with npm 10.9.4, vinext 1.1.0, React 19.2.8, Vite 8.3.4 and Wrangler 4.149.0 are pinned in the lockfile. Native Workers Builds should use root `/`, production `main`, build `npm run build`, deploy `npm run deploy`. `vercel.json` disables Git deployments so publishing the migration cannot replace the retained Vercel recovery deployment. No deployment credential belongs in GitHub.

`wrangler.jsonc` binds the provisioned production D1 `d11510fb-afa5-40c5-9ca7-0b1d26f5a6af`, has no custom-domain routes, disables previews, and keeps `READ_ONLY=true`. Its schema is initialized with no application rows. Staging D1 is `6958274c-ff30-4a5b-b5f5-34056ea44032`; actual private-data rehearsal uses separate D1 `1dd47184-f0fe-4bc7-8b16-f21ac8544d3e`. Never expose that rehearsal database through a Worker. Final source freeze/export/import and native Git publishing are still pending. Logs/traces are enabled without logging request bodies, wallet signatures, database rows or credentials.

Required configuration:

- Public wallet configuration: `lib/privy.ts` preserves the existing W3RK Privy app ID, verified from the live frontend. This is public browser configuration and requires no build secret or new account. Verify the intended staging/production origins and wallet behavior.
- `NEXTAUTH_SECRET`: stable high-entropy Worker runtime secret, at least 32 characters. Missing/short secrets fail closed; builds need no signing secret. Keep the same secret across releases if sessions should survive.
- `NEXTAUTH_URL`: exact canonical HTTPS origin (production `https://w3rk.net`). Only loopback HTTP is accepted for local tests.
- `AUTH_ALLOWED_CHAIN_IDS`: preserves the existing Base, Base Sepolia and Ethereum list `8453,84532,1`.
- `READ_ONLY`: only the exact string `false` enables application writes and login challenge issuance/consumption. Reading existing sessions/public data remains available; signout remains available.

The NextAuth v4 compatibility scanner warns about API internals. The production Worker HTTP test proves CSRF, credentials, JWT session, signout and protected API handling with the pinned version. A narrow CommonJS default adapter fixes Vite 8 module wrapping. Privy 3.48.1 and viem 2.56.5 are pinned. The obsolete Thirdweb transport aliases are removed. A clean npm10 install needs the explicit date-fns4.4.0 peer pin alongside MetaMask's nested2.x dependency. The rebuilt Worker is6144.48KiB compressed and passes local workerd auth and browser/PWA smoke tests.

## Data and authorization

D1 uses typed prepared statements for the eight existing tables and an additional `auth_challenges` table. Original row IDs, nullable fields, unique constraints, relationships, cascades and UTC millisecond timestamps are preserved. Wallet addresses compare case-insensitively; the importer rejects pre-existing case collisions instead of merging accounts. User+listing/skill/endorsement, room+deduplicated participants, and message+room timestamp mutations use atomic D1 batches.

Only a signed NextAuth session authenticates API requests. [Wallet verification](wallet-authentication.md) supports EOAs and chain-bound ERC-1271/ERC-6492 contract signatures; the server records verified type and chain for the XMTP adapter. An unsigned wallet header or connection state grants no permissions. SIWE requires the configured domain/origin/chain, a browser-bound random challenge, five-minute issued/expiry times and a valid signature. A conditional D1 update consumes each nonce once, including concurrent requests. Mutating application APIs also require same-origin requests; chat reads/writes require membership.

XMTP uses the explicitly selected Privy wallet through a shared message-signing adapter and browser SDK 4.1.0 DMs addressed by resolved inbox ID, reuses conversations, and closes streams/client on cleanup. Decoded sender identity comes from inbox membership and nanosecond timestamps. Incoming network messages remain client-side and are never posted to D1 as the receiving user. App messages use a room-specific envelope; generic external DMs are not attributed to an app room. Navigation and session changes cancel stale reads and bind sends to one loaded room snapshot. Server persistence/authorization precedes external delivery; delivery failure remains distinct from save failure. Disposable EOA signers have passed live XMTP dev-network acceptance. Wallet-extension signing, Privy staging-origin acceptance, and hosted smart-wallet XMTP acceptance still require interactive verification.

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

### Final export from the original five-table source

The default `export-pg OUTPUT` command requires all eight application tables. For
the explicitly approved original source mapping, use this separate opt-in mode
only after the coordinator proves the source freeze and completes the drain:

```bash
# DATABASE_URL is supplied privately in the process environment, never in argv.
# PRIVATE_DIRECTORY must already exist with mode0700.
node scripts/transfer-data.mjs export-pg PRIVATE_DIRECTORY --source-mapping original-five-table-v1
```

This command inspects the public schema and reads all five original tables in one
read-only repeatable-read transaction. It requires exactly the original table
and column names, data types, nullability, defaults and timestamp precision.
The optional `_prisma_migrations` table is recorded as excluded metadata. Any
unexpected application table, any newly present chat table, or schema mismatch
stops the export. All record fields, IDs, timestamps, relationships and uniqueness
checks apply before initializing the three explicitly absent chat tables empty.
Source constraints are still compared during the coordinator's schema preflight;
this export's schema guard checks columns and validates record relationships.

The private directory receives timestamped `*-source.json` and `*-manifest.json`
files with mode0600 and overwrite protection. The manifest records the approved
mapping, schema fingerprint, counts and canonical data digest. Stdout reports
filenames/counts/digest only. A filesystem failure may leave one private file;
preserve it and inspect before taking a new export. No database is modified.

Take two fresh exports separated by the agreed drain interval, validate both and
compare canonical records before generating final import SQL. Do not reuse the
earlier rehearsal snapshot. This option does not establish a writer freeze or
authorize import, routing changes or write enablement. If the schema changes,
review the mapping instead of treating missing or additional tables as empty.

## Local verification

```
npm ci
npm run cf:types
npm run typecheck
npm run test:unit
npm run build
npm run deploy:check
```

Use Node from `.nvmrc` and npm 10.9.4 (`packageManager` and CI pin). Generate lockfiles with this toolchain in a clean checkout; npm 11 produced an incomplete peer/optional-platform tree for npm 10 CI. Local auth tests need a fresh random test-only secret and loopback `NEXTAUTH_URL` in ignored `.dev.vars`, `READ_ONLY=false`, and `wrangler d1 migrations apply DB --local`. Run the built Worker using `vite preview --host 127.0.0.1 --port 5193`; the preview config is under `dist/server`, so place the ignored test `.dev.vars` beside that generated config. Then run `node scripts/smoke-local-auth.mjs` and `node scripts/smoke-local-browser.mjs`. That script refuses non-loopback hosts and creates synthetic local records only. GitHub CI runs these local checks on Node 22 with an ephemeral test-only secret and has no deployment credentials. Test production HTTPS cookie flags again on isolated staging.

## Isolated HTTPS staging verification (2026-10-12)

Source `5b8f54cb117178558b66dfcdb48addae549fae4c` was built with staging-only configuration and published to `https://w3rk-net-staging.bcrt43.workers.dev`, version `df97c1ba-652b-4529-b448-31853c9950a0`. The Worker did not exist before setup, has no native build/custom-domain connection, previews are disabled, and its only D1 binding is staging `6958274c-ff30-4a5b-b5f5-34056ea44032`. A new independent stable session secret was generated in memory and piped directly to Cloudflare; its value was not printed or saved.

Two complete HTTPS synthetic flows passed secure cookies, CSRF, signed SIWE login/session, forged-header and cross-origin denial, listing/chat persistence and membership, nonce replay rejection, signout and private-read denial. The first immediate post-deployment chat write returned 404; the cause is unproven and was not reproduced by the two subsequent flows. Keep that observation with the successful evidence. Installed Google Chrome passed hydration/navigation, the explicit wallet-unconfigured message and legacy service-worker cache cleanup without page errors. Playwright's pinned browser download did not support the local Ubuntu 26.04 host, so the installed Chrome channel was used.

After evidence collection, only the exact recorded synthetic IDs were deleted following counts/content/test-window validation. All nine staging tables are empty again. Private receipts, scoped test scripts, binding/version metadata and logs remain in the coordinator's ignored `work/vercel-migration/w3rk-recovery/` and `w3rk-ci/`. Staging still needs an owner-approved Thirdweb public client and live two-wallet XMTP acceptance; it proves the server protocol independently of the wallet UI. This evidence does not prove production native-build identity or authorize a source freeze/cutover.

The server layout now renders “Updates and sign-in are temporarily paused. You can still browse.” from the request's read-only binding. Local production-artifact checks prove the notice appears with `READ_ONLY=true` and disappears with `false` without rebuilding; nonce issuance remains 503/no-store while read-only.

Separate live XMTP Browser SDK 4.1.0 dev-network acceptance used two disposable in-memory EOA signers in isolated Chrome contexts, with the app's messaging/envelope helpers and only the network option changed in a temporary harness. Registration, DM reuse, inbound sender/timestamp correctness, wrong-room rejection, stale-context send denial, stream stop/history synchronization and client close all passed. No app API/D1 calls occurred during inbound network delivery. The harness contacted only loopback and `dev.xmtp.network`; no existing users, wallet funds, transactions or other app client IDs were involved. This verifies messaging adapter behavior independently of the still-pending Thirdweb wallet-extension UI and production-network checks.
