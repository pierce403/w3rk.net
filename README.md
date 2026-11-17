# w3rk.net — decentralized tasking with UBI

w3rk.net is a decentralized TaskRabbit-style platform built on Base. Workers can find and complete jobs, requesters can post and escrow tasks, and seekers earn an Active Seeker Dividend (ASD) if they are actively checking for jobs but not yet matched.

## Current State

MVP App Router frontend being migrated from Vercel to Cloudflare:
- Jobs browsing page
- Job posting interface  
- Profile/about pages
- Basic API routes
- Health check endpoint

## Roadmap

### Phase 1: Contracts on Base
- Smart contract escrow system
- Streaming payments integration
- Attestation schemas
- UBI/ASD eligibility and distribution logic

### Phase 2: XMTP Chat Integration
- Private job communication threads
- Real-time notifications
- Worker-requester messaging

### Phase 3: MiniApp on Base
- MiniKit integration
- OnchainKit wallet connection
- On-chain job lifecycle actions

### Phase 4: Reputation & Dispute Resolution
- EAS-based reputation system
- UMA optimistic oracle for disputes
- Optional Kleros escalation

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the application.

## Deploy to Cloudflare

This migration uses native Cloudflare Git builds, Workers and D1. Pushes to the configured production branch build and publish in Cloudflare. No Cloudflare credential is stored in GitHub. Vercel Git deployments are disabled; the previous deployment remains recovery evidence.

Read [migration and recovery instructions](docs/cloudflare-migration.md) before provisioning or publishing. The checked-in D1 ID names the provisioned production database and writes default to disabled. A stable runtime authentication secret, verified Privy wallet behavior, reconciled data import and native build are required before cutover.

## Health Check

`GET /api/health` returns `{ ok: true }`

## License

This project is open source. See LICENSE file for details.

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests. For major changes, please open an issue first to discuss what you would like to change.
## Licensing scope

Original project code and documentation are licensed under the [Apache License, Version 2.0](LICENSE). Third-party dependencies, vendored code, quoted material, data, fonts, media, and other third-party assets retain their respective licenses and rights; this grant does not relicense them. Existing license notices and attribution must be preserved.

Earlier MIT grants remain valid; the previous license text is preserved in [LICENSE-MIT](LICENSE-MIT).

The flattened OpenZeppelin-derived `contracts/W3rkToken_v5_flat.sol` retains its MIT license and is excluded from the Apache-2.0 grant.

Solidity sources retain their existing file-level SPDX identifiers, including MIT-licensed contracts and any UNLICENSED scaffold fixtures. Those files are excluded from the repository-wide Apache-2.0 grant. Their source bytes are preserved to avoid changing compiler metadata or historical verification artifacts.
