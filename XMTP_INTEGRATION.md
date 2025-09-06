# XMTP v3 Integration Plan

## 🎯 Goal: Cross-App Messaging Interoperability

Enable users to carry their w3rk.net conversations across all XMTP-enabled apps in the web3 ecosystem.

## 🏗️ Architecture: Hybrid Database + XMTP

### Database Layer (Persistence)
- **Purpose**: Fast UI, reliable storage, fallback messaging
- **Benefits**: Instant load, search, pagination, offline access
- **Models**: `ChatRoom`, `ChatParticipant`, `ChatMessage`
- **Storage**: PostgreSQL via Prisma ORM

### XMTP Layer (Decentralization)
- **Purpose**: Cross-app interoperability, p2p messaging
- **Benefits**: User owns conversations, works across all XMTP apps
- **Protocol**: XMTP v3 with MLS encryption
- **Sync**: `xmtpId` field links database records to XMTP messages

## 📦 Implementation Status

### ✅ Completed (Phase 1)
- [x] Chat authentication fixed (Thirdweb integration)
- [x] Database schema with `xmtpId` field prepared
- [x] XMTP SDK dependencies installed (`@xmtp/browser-sdk`)
- [x] Basic XMTP client structure in `lib/xmtp.ts`
- [x] Chat UI works with database-backed messaging

### 🔄 In Progress (Phase 2)
- [ ] **XMTP Client Initialization**: Proper setup with Thirdweb wallet signers
- [ ] **Conversation Management**: Create/retrieve XMTP conversations for chat rooms
- [ ] **Message Sync**: Send messages to both database AND XMTP network
- [ ] **Real-time Updates**: Stream XMTP messages and sync to local state

### 📋 Planned (Phase 3)
- [ ] **Group Chat Support**: XMTP v3 group conversations for multi-user job threads
- [ ] **Message History Sync**: Merge XMTP history with database records
- [ ] **Conflict Resolution**: Handle message ordering across database/XMTP
- [ ] **Offline Support**: Queue XMTP messages when offline

## 🛠️ Technical Implementation

### Current Flow (Database Only)
```
User sends message → API stores in database → Update UI
```

### Target Flow (Hybrid)
```
User sends message → 
├─ API stores in database (instant UI update)
└─ XMTP client sends to network (cross-app sync)

Other app sends message →
├─ XMTP client receives → API stores with xmtpId
└─ UI updates with new message
```

### Message Schema
```typescript
interface ChatMessage {
  id: string           // Database ID
  content: string      // Message text
  xmtpId?: string     // XMTP message ID for cross-reference
  senderAddress: string
  chatRoomId: string
  createdAt: Date
}
```

### XMTP Client Integration
```typescript
// Initialize with Thirdweb wallet signer
const xmtpClient = await Client.create(thirdwebWalletSigner, {
  env: 'production'
})

// Create conversation for job chat
const conversation = await xmtpClient.conversations.newConversation(jobOwnerAddress)

// Send message via XMTP
const xmtpMessage = await conversation.send(messageContent)

// Store in database with XMTP ID
await storeMessage(messageContent, xmtpMessage.id)
```

## 🔍 Why XMTP v3 is Critical

### Cross-App Continuity
- User starts conversation in w3rk.net
- Continues same conversation in any XMTP-enabled app
- Message history and context preserved

### True Decentralization
- Messages not locked to single platform
- User owns their conversation data
- No vendor lock-in or platform dependency

### Web3 Ecosystem Integration
- Works with Lens, Farcaster, XMTP-enabled wallets
- Unified messaging layer across web3
- Future-proof messaging infrastructure

## 📱 User Experience

### Current State
✅ **Chat works** - Users can send/receive messages in job/service threads
✅ **Fast & Reliable** - Database-backed for instant updates
❌ **Platform-locked** - Conversations only exist in w3rk.net

### After XMTP Integration
✅ **Chat works everywhere** - Same conversations in all XMTP apps
✅ **Fast & Reliable** - Hybrid approach maintains speed
✅ **Decentralized** - User owns conversation data
✅ **Future-proof** - Works with any future XMTP-enabled app

## 🚀 Rollout Strategy

### Phase 2A: Basic XMTP (Current Focus)
- Initialize XMTP client with Thirdweb wallets
- Send new messages to both database and XMTP
- Test with simple 1:1 conversations

### Phase 2B: Group Conversations
- Multi-participant job/service chat rooms
- XMTP v3 group conversation support
- Handle participant management

### Phase 2C: Real-time Sync
- Stream incoming XMTP messages
- Update UI when messages arrive from other apps
- Handle message deduplication

### Phase 3: Advanced Features
- Message encryption indicators
- Offline message queuing
- Advanced conversation management
- Cross-app user discovery

---

**Status**: Foundation complete, moving to client initialization and message sync.
