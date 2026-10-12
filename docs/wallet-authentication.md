# Wallet authentication and XMTP

The signed server session records the address, chain and verified wallet type. A browser wallet ID or a connection alone does not determine authorization or the XMTP signer type.

SIWE parsing and exact domain/origin/version/allowed-chain checks precede cryptographic verification. Challenges are browser-bound, expire after five minutes and are consumed once with a conditional D1 update. Time is checked again after contract RPC verification so a challenge cannot expire in flight and still be accepted.

- Ordinary EOA signatures are recovered locally, including EIP-7702 accounts signing as EOAs. They need no RPC.
- Contract signatures use `isValidSignature(bytes32,bytes)` on the declared chain at a captured block number and require the exact ERC-1271 magic value. Wrapped ERC-6492 signatures use viem's universal verifier at that block through `eth_call`; no transaction or wallet deployment is submitted.
- Contract verification only uses the app's fixed Base, Base Sepolia and Ethereum public RPC configuration. Each request has an eight-second timeout with no retries. Unsupported chains, RPC failures, malformed signatures and invalid contract results fail closed. The existing configured chain allowlist still applies before RPC access.
- The `siwe` parser remains, but its `verify()` method is not called: version 2.3.2 logs raw ethers errors for malformed signatures. The replacement catches verification errors without logging submitted signatures or RPC payloads.

XMTP derives its EOA/SCW type and chain from the server-verified session. The active wallet and chain must match, and signing checks that context both before and after the wallet prompt. Client reuse is keyed by type, chain and address. Account, chain, session or component changes close the previous client and streams.

The pinned Browser SDK 4.1.0 requires a synchronous bigint `getChainId()` for SCWs. `getBlockNumber` is intentionally omitted so XMTP verifies against its latest block, rather than a stale login block. Of the app's chains, XMTP supports SCWs on Ethereum and Base. Base Sepolia SCW sessions can use database messaging and receive an explicit XMTP-unavailable message. EOA messaging remains available there.

The pinned XMTP WASM revision contains ERC-6492 verification support, with limitations around prepare/side-effect behavior. The app passes wrapped signatures intact; it does not claim every counterfactual wallet scheme works. Database persistence and network delivery remain separate, and received network messages are never stored as the receiving user.

## Evidence and remaining acceptance

Synthetic tests exercise real viem ABI encoding/hash/recovery against a controlled ERC-1271 RPC fixture, invalid signatures and magic returns, wrong chain/message, concurrent nonce replay, expiry during RPC, and no raw-error logging. Wrapped-signature tests exercise real viem deployless encoding, exact signature passthrough, fixed block, false and revert responses. XMTP tests cover signer bytes, chain/type identity, unsupported chains and wallet changes during prompts. These fixtures do not execute a live EVM or prove hosted XMTP contract verification.

The existing two-disposable-EOA XMTP dev-network test proved conversation reuse, inbound provenance, stream cleanup and no inbound D1 calls. Interactive Thirdweb wallet UI and hosted XMTP smart-wallet acceptance remain separate gates requiring the owner's approved public client ID/origin configuration. No owner key, funds or financial transaction is used by these synthetic tests.

## Primary references

- [ERC-1271 contract signature validation](https://eips.ethereum.org/EIPS/eip-1271)
- [ERC-6492 counterfactual signatures](https://eips.ethereum.org/EIPS/eip-6492)
- [Viem public-client verification](https://viem.sh/docs/actions/public/verifyMessage)
- [Thirdweb wallet/account signing interface](https://portal.thirdweb.com/references/typescript/v5/Wallet)
- [XMTP signer and supported-chain contract](https://docs.xmtp.org/chat-apps/core-messaging/create-a-signer)
- [Pinned XMTP verifier source](https://github.com/xmtp/libxmtp/blob/a9d19aa87ccfbf3fd02bdd5db93d588b07dc4f60/xmtp_id/src/scw_verifier/chain_rpc_verifier.rs)
