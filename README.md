# w3rk.net — decentralized tasking with UBI

w3rk.net is a decentralized TaskRabbit-style platform built on Base. Workers can find and complete jobs, requesters can post and escrow tasks, and seekers earn an Active Seeker Dividend (ASD) if they are actively checking for jobs but not yet matched.

## Current State

MVP Next.js frontend with basic functionality deployed on Vercel:
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

## Deploy to Vercel

1. Push this repo to GitHub
2. In Vercel, click **New Project → Import Git Repository** and select your repo
3. Framework preset: **Next.js**. Leave defaults
4. Deploy. Every push creates a new preview; the default branch becomes **Production**

For more details:
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Git deploys](https://vercel.com/docs/git)
- [Custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

## Health Check

`GET /api/health` returns `{ ok: true }`

## License

This project is open source. See LICENSE file for details.

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests. For major changes, please open an issue first to discuss what you would like to change.