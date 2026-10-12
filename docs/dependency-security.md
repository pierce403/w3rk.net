# Dependency security review, 2026-10-12

React, React DOM and react-server-dom-webpack are pinned together at 19.2.8. This is an explicitly patched version for CVE-2026-44907 / GHSA-wx67-qw84-cm4g, whose affected 19.2 range ends at 19.2.7. Current npm audit reports no React/RSC advisory. Moving to 19.3.0 is not required for that fix; React recommends pinning framework/bundler RSC dependencies because their internal APIs can change across minors.

- https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g
- https://react.dev/reference/rsc/server-components

Next was patched from 16.3.1 to 16.3.8 without a minor-version jump. The package supplies NextAuth's peer and types; vinext owns the deployed server and `next/*` shims. The app does not use Next's native image optimizer, `next/og`, Draft Mode or `use cache`, and the Worker is not a Windows Next server. Even though those reported critical paths were not the app's execution path, the same-minor package fix removes their audit findings. Playwright was patched from 1.55.0 to 1.55.1 for its browser-download TLS verification fix.

Fresh npm 10.9.4 audit after those changes: production graph (`--omit=dev`) has 0 critical, 15 high and 22 moderate findings. This is a dependency-path assessment, not a claim that the whole graph is advisory-free:

| Reported chain | Application relevance |
|---|---|
| Thirdweb → toml | Imported only by the SDK's Stylus CLI builder. W3RK imports browser client/React/wallet APIs, does not run the Thirdweb CLI or parse TOML input. |
| XMTP proto → undici 5 → busboy | The proto package's Node entry installs an Undici fetch fallback; its browser entry does not. W3RK uses browser-sdk in a client component, and browser/workerd provide fetch. No multipart parser route is implemented. |
| ethers / viem / WalletConnect → Node ws | The app's server uses SIWE cryptography and viem HTTP ENS/Base queries, never a WebSocket provider. Browser wallet/XMTP messaging uses native browser WebSocket. Node ws is a reported dependency, not an exposed Worker WebSocket server. Live wallet acceptance remains required. |
| vinext → commonjs/dynamic-import → fast-glob/micromatch/braces | Build-time local module-pattern expansion, not a public request-controlled glob endpoint. Audit proposes an unsuitable vinext downgrade; no forced downgrade applied. |
| Thirdweb engine code-generation tooling → Hey API → js-yaml | OpenAPI generation tooling is not an application input path; W3RK does not accept YAML. |

Full audit additionally reports two critical entries in the unused development chain truffle-flattener → @resolver-engine/imports-fs → @resolver-engine/imports → @resolver-engine/core → request → form-data. The site build, authentication and request handlers do not run the Solidity flattener. Contract-development dependencies remain preserved; audit's proposed major/downgrade change was not forced.

Raw current audits, dependency paths and clean-install/build evidence are kept in the coordinator's ignored `work/vercel-migration/w3rk-ci/`. Re-check the report when enabling new SDK features or routes; do not treat unused-path analysis as permanent remediation.
