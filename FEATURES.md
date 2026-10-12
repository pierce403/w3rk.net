# Migration acceptance

| Capability | Evidence | Remaining gate |
|---|---|---|
| Cloudflare runtime | Pinned Node 22/vinext production build, typecheck and Wrangler dry-run | Native Git build and exact deployed version |
| Wallet session | Local production workerd CSRF/login/session/logout and replay rejection | Approved Thirdweb client, HTTPS cookie and interactive wallet checks |
| D1 integrity | Synthetic atomic rollback, uniqueness and room access tests | Source schema inventory and actual-data rehearsal |
| Recovery | Synthetic eight-table D1 → PostgreSQL exact canonical hash | Private source export, isolated D1/reverse PostgreSQL comparison |
| Read-only maintenance | Local runtime reads return 200, mutations/nonce return 503 | All source writers frozen for final export |
| XMTP | Typed SDK v4 signer, inbox resolution, reuse and cleanup; no inbound D1 writes | Two-wallet live delivery and history verification |
| Offline cache isolation | Generated SW excludes private paths; Chromium confirms legacy cache deletion and unrelated cache preservation | Public-domain browser confirmation |
| Native Git publishing | Vercel automatic Git builds disabled in source | Cloudflare connection, runtime binding/secret and approved public build variable |
