# TODO

## Done / In Progress

### ✅ Completed
- [x] Basic Next.js MVP frontend structure
- [x] Jobs browsing page (`/j`)
- [x] Job posting interface (`/post`)
- [x] About/profile pages
- [x] Basic API routes and health check
- [x] Vercel deployment setup
- [x] Sign-In With Ethereum (SIWE) authentication
- [x] QR code wallet connection via Privy
- [x] User profiles with ENS/Base name resolution
- [x] Skills with endorsement system
- [x] Vercel Postgres database with Prisma ORM
- [x] Persistent data storage for all content
- [x] Database migration complete - all API routes now use Postgres
- [x] **Auth Plumbing**: Privy integration with Coinbase Smart Wallet support
- [x] **Base App Login**: "Continue with Base (Coinbase)" button on homepage
- [x] **Smart Wallet Support**: Embedded wallets with user-friendly onboarding
- [x] **ENS Integration**: Real-time name resolution and profile links

### 🔄 In Progress
- [ ] **Auth UX Polish**: Improve loading states and error handling
- [ ] **Gasless Paymaster**: Integrate Base paymaster for free transactions
- [ ] **Base Chain Restriction**: Restrict app to Base network only for production

## Roadmap (Updated Priorities)

### 🥇 Phase 1: XMTP Chat Integration (PRIORITY)
- [ ] **XMTP SDK Setup**: Install and configure XMTP SDK for decentralized messaging
- [ ] **Chat Infrastructure**: Scaffold `app/chat/` directory with React components
- [ ] **Job Threads**: Wire private communication channels between workers and requesters per job
- [ ] **Chat UI**: Build intuitive chat interface with message history
- [ ] **Notifications**: Integrate real-time notifications for new messages and job updates
- [ ] **Message Persistence**: Implement chat history storage and retrieval
- [ ] **Mobile Optimization**: Ensure chat works seamlessly on mobile devices

### 🥈 Phase 2: Base MiniApp (MiniKit/OnchainKit) (PRIORITY) 
- [ ] **Package Installation**: Install and configure MiniKit + OnchainKit dependencies
- [ ] **Wallet Connection**: Handle Base wallet connection and session management within MiniApp
- [ ] **Job Actions**: Wire job creation, acceptance, completion flows optimized for MiniApp
- [ ] **Transaction UX**: Implement smooth transaction flows with proper loading states
- [ ] **Base Integration**: Leverage Base-specific features and ecosystem tools
- [ ] **MiniApp Optimization**: Optimize for Base ecosystem and mobile-first experience

### 🥉 Phase 3: Token Distribution (ASD System) (PRIORITY)
- [ ] **Active Seeker Dividend (ASD)**: Design epoch-based UBI system for job seekers
- [ ] **Check-in Mechanism**: Build proof-of-seeking system with activity verification
- [ ] **Identity Gating**: Integrate Worldcoin World ID or Gitcoin Passport for Sybil resistance
- [ ] **Payout Distribution**: Implement automated ASD distribution system
- [ ] **Treasury Management**: Set up sustainable funding mechanism for UBI payouts
- [ ] **Reputation Tokens**: Design reward system for quality work and engagement

### 🔧 Phase 4: Smart Contracts on Base (LOWER PRIORITY)
- [ ] **Escrow Contract**: Implement smart contract for job payment escrow with release conditions
- [ ] **Streaming Payments**: Integrate Superfluid or Sablier for milestone-based streaming payments
- [ ] **Attestation Schemas**: Design EAS schemas for job completion, worker verification, and seeker activity
- [ ] **Base Deployment**: Deploy contracts to Base mainnet with proper verification
- [ ] **Contract Integration**: Connect frontend to smart contracts

### 🛡️ Phase 5: Reputation & Dispute Resolution
- [ ] **EAS Integration**: Build EAS schema for JobCompleted attestations with rating/feedback
- [ ] **Seeker Attestations**: Create ActiveSeeker attestations for ASD eligibility tracking
- [ ] **Reputation Scoring**: Implement worker/requester reputation calculation and display
- [ ] **Dispute System**: Integrate UMA optimistic oracle for job completion disputes
- [ ] **Kleros Escalation**: Add optional Kleros integration for complex dispute escalation

## Future Enhancements
- [ ] Mobile app (React Native or PWA)
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] AI-powered job matching
- [ ] Skills verification and badges
- [ ] Community governance token
- [ ] Integration with existing gig platforms