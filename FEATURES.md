# Migration acceptance

| Capability | Evidence | Remaining gate |
|---|---|---|
| Cloudflare runtime | Pinned Node 22/vinext production build, typecheck and Wrangler dry-run | Native Git build and exact deployed version |
| Wallet session | Local/isolated HTTPS CSRF/login/session/logout; EOA and controlled ERC-1271/ERC-6492 verification, nonce replay and expiry-during-RPC tests | Approved Thirdweb client and interactive wallet checks; hosted smart-wallet acceptance |
| D1 integrity | Synthetic atomic rollback, uniqueness and room access tests | Final writer freeze and production import |
| Recovery | Synthetic eight-table D1 → PostgreSQL exact canonical hash | Actual-data D1/original-PG hash matches; future-chat reverse verified; final frozen export remains |
| Read-only maintenance | Local runtime reads return 200, mutations/nonce return 503 | All source writers frozen for final export |
| XMTP | Two disposable EOA signers passed dev-network delivery/history/cleanup; chain/type-bound SCW signer and stale-wallet tests pass | Integrated Thirdweb wallet UI and hosted smart-wallet delivery |
| Offline cache isolation | Generated SW excludes private paths; Chromium confirms legacy cache deletion and unrelated cache preservation | Public-domain browser confirmation |
| Native Git publishing | Vercel automatic Git builds disabled in source | Cloudflare connection, runtime binding/secret and approved public build variable |
