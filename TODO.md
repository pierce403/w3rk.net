# TODO

## Done / In Progress

### ✅ Completed
- [x] Basic Next.js MVP frontend structure
- [x] Jobs browsing page (`/jobs`)
- [x] Job posting interface (`/post`)
- [x] About/profile pages
- [x] Basic API routes and health check
- [x] Vercel deployment setup

### 🔄 In Progress
- [ ] _Nothing currently in progress_

## Roadmap

### Phase 1: Contracts on Base
- [ ] **Escrow Contract**: Implement smart contract for job payment escrow with release conditions
- [ ] **Streaming Payments**: Integrate Superfluid or Sablier for milestone-based streaming payments
- [ ] **Attestation Schemas**: Design EAS schemas for job completion, worker verification, and seeker activity
- [ ] **UBI Distribution**: Build Active Seeker Dividend (ASD) contract with epoch-based payouts
- [ ] **Base Integration**: Deploy contracts to Base mainnet with proper verification

### Phase 2: XMTP Chat Integration
- [ ] **Chat Infrastructure**: Scaffold `app/chat/` directory with XMTP SDK integration
- [ ] **Job Threads**: Wire private communication channels between workers and requesters per job
- [ ] **Notifications**: Integrate real-time notifications for new messages and job updates
- [ ] **Message History**: Implement persistent chat history and message status tracking
- [ ] **Mobile Optimization**: Ensure chat works seamlessly on mobile devices

### Phase 3: MiniApp on Base (MiniKit/OnchainKit)
- [ ] **Package Installation**: Install and configure MiniKit + OnchainKit dependencies
- [ ] **Wallet Connection**: Handle Base wallet connection and session management
- [ ] **Job Actions**: Wire job creation, acceptance, completion to onchain contracts
- [ ] **Transaction UX**: Implement smooth transaction flows with proper loading states
- [ ] **MiniApp Optimization**: Optimize for Base ecosystem and mobile-first experience

### Phase 4: Reputation & Dispute Resolution
- [ ] **EAS Integration**: Build EAS schema for JobCompleted attestations with rating/feedback
- [ ] **Seeker Attestations**: Create ActiveSeeker attestations for ASD eligibility tracking
- [ ] **Reputation Scoring**: Implement worker/requester reputation calculation and display
- [ ] **Dispute System**: Integrate UMA optimistic oracle for job completion disputes
- [ ] **Kleros Escalation**: Add optional Kleros integration for complex dispute escalation

### Phase 5: Active Seeker Dividend (ASD) Logic
- [ ] **Epoch System**: Define time-based epochs for seeker activity tracking (daily/weekly)
- [ ] **Check-in Mechanism**: Build proof-of-seeking system with location/time verification
- [ ] **Identity Gating**: Integrate Worldcoin World ID or Gitcoin Passport for Sybil resistance
- [ ] **Payout Distribution**: Implement automated ASD distribution based on active seeking attestations
- [ ] **Treasury Management**: Set up sustainable funding mechanism for UBI payouts

## Future Enhancements
- [ ] Mobile app (React Native or PWA)
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] AI-powered job matching
- [ ] Skills verification and badges
- [ ] Community governance token
- [ ] Integration with existing gig platforms