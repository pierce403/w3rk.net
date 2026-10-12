# Wallet authentication and XMTP

The signed server session records the address, chain and verified wallet type. A browser wallet ID or a connection alone does not determine authorization or the XMTP signer type.

## Privy connection and selected wallet

The frontend now uses pinned Privy 3.48.1 with viem 2.56.5. `lib/privy.ts` preserves the existing public W3RK application ID, `cmf7drcls001ijr0bckpes5lc`, verified from the live frontend. This browser identifier is checked-in configuration, not a secret or a newly created account. The provider retains wallet and Farcaster login, embedded Ethereum wallet creation, Coinbase smart-wallet and EOA choice, Base as the default chain, and Base, Base Sepolia and Ethereum as supported chains. The current Coinbase configuration is `externalWallets.coinbaseWallet.config.preference.options=all`. Forcing `smartWalletOnly` renames the SDK connector to `coinbase_smart_wallet`, which Privy 3.48.1 filters out of its supported `coinbase_wallet` appearance list. The supported chooser restores the wallet option without guessing or casting an unsupported wallet name. CUA confirms both Coinbase Wallet and Farcaster buttons load with no console errors; actual wallet signing remains a separate gate.

`components/AuthProvider.tsx` waits for Privy, connected-wallet and NextAuth hydration, then shares one explicit wallet selection with the wallet button and XMTP hook. A restored session does not silently choose `user.wallet` or the first connected wallet. The user selects a particular connected wallet; connection alone never replaces the app's signed SIWE session.

`lib/selected-wallet.ts` obtains that wallet's Ethereum provider and checks fresh `eth_accounts` and `eth_chainId` before and after `personal_sign`. The request names the selected address explicitly and encodes the exact UTF-8 message. After the prompt it obtains the provider again because Privy can replace provider instances when switching networks. Signature bytes, including ERC-6492 wrappers, pass through unchanged. Provider events and selection changes invalidate the operation generation, so changing away and back during a prompt cannot revive it. No wallet transaction is requested by this adapter.

Logout invalidates signing immediately and clears both NextAuth and Privy sessions. It waits for an already-submitted NextAuth callback before clearing its cookie, but does not wait for an unanswered wallet prompt. That late prompt cannot submit credentials; another sign-in stays blocked until the old operation settles. Account, chain and logout invalidation also disconnect the XMTP client synchronously, before React effect cleanup. Provider objects may change without retriggering the connection effects unless their selection, address, chain or operation generation changes.

The older Privy frontend at `61c58aef29ac59d6bdac04a007e84cd20790b816` supplies the application identity and connection intent, not the old authorization implementation. Its unsigned wallet-header interception and fabricated XMTP signatures are not restored. The migration's SIWE, NextAuth, D1 and server-verified XMTP signer logic remains in place.

## Server verification and messaging

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

The Privy revision adds 12 passing tests in `tests/unit/selected-wallet.test.ts`, run with Node 22.22.0 and the installed Privy 3.48.1 / viem 2.56.5 graph. They cover strict chain parsing; fresh account/chain reads; explicit selection even when another address is first in the provider list; real disposable-EOA signatures over exact SIWE/XMTP message bytes; changes during provider acquisition or signing; provider replacement; intact ERC-6492 bytes; malformed signatures; and logout/late-callback ordering, including an unanswered wallet prompt. The provider is controlled in these tests: they exercise the application adapter, not an actual Privy login, Coinbase popup, live contract or hosted XMTP smart-wallet verification.

Earlier migration acceptance with two disposable EOAs on the XMTP dev network proved conversation reuse, inbound provenance, stream cleanup and no inbound D1 calls. Earlier local workerd and isolated staging tests proved the signed-session and protected-API paths for that earlier migration revision. Those results remain historical evidence; they do not prove the revised Privy SDK integration. The superseded Thirdweb frontend's missing public client ID is no longer the configuration dependency.

Clean Node 22.22.0/npm 10.9.4 installation, typecheck, all 35 unit tests, production build and Wrangler dry-run pass. An explicit date-fns 4.4.0 peer pin fixes npm 10 optional-peer placement while retaining MetaMask's nested date-fns 2. Local production workerd passes signed EOA login, session type/chain, writes/chat, replay denial, origin/header rejection and logout. Installed Chrome passes hydration, navigation and legacy service-worker cache cleanup. The compressed Worker bundle is 6144.48 KiB. Browser SDK initialization and the Privy dialog are verified separately; real wallet signing remains unproven.

Before release, interactive Privy acceptance is also required on the intended staging origin. Confirm the existing app's allowed origins, wallet/Farcaster connection, explicit wallet selection, real EOA and Coinbase smart-wallet signing, account/chain changes, and both-session logout. Hosted smart-wallet XMTP acceptance remains a separate gate. The existing public app ID alone does not prove those behaviors. Use disposable test identities; the synthetic tests use no owner key, funds or financial transaction.

## Primary references

- [Privy React provider setup and readiness](https://docs.privy.io/basics/react/setup)
- [Privy React SDK 3 migration](https://docs.privy.io/basics/react/advanced/migrating-to-3.0)
- [Privy Ethereum message signing](https://docs.privy.io/wallets/using-wallets/ethereum/sign-a-message)
- [ERC-1271 contract signature validation](https://eips.ethereum.org/EIPS/eip-1271)
- [ERC-6492 counterfactual signatures](https://eips.ethereum.org/EIPS/eip-6492)
- [Viem public-client verification](https://viem.sh/docs/actions/public/verifyMessage)
- [Historical Thirdweb wallet/account signing interface](https://portal.thirdweb.com/references/typescript/v5/Wallet) (superseded frontend)
- [XMTP signer and supported-chain contract](https://docs.xmtp.org/chat-apps/core-messaging/create-a-signer)
- [Pinned XMTP verifier source](https://github.com/xmtp/libxmtp/blob/a9d19aa87ccfbf3fd02bdd5db93d588b07dc4f60/xmtp_id/src/scw_verifier/chain_rpc_verifier.rs)
