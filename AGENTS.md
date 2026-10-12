# W3RK migration maintenance

Read README.md, NOTES.md and docs/cloudflare-migration.md before deployment/data work.

- Cloudflare native Git owns publishing from main; deployment credentials stay in Cloudflare. Keep Vercel Git deployments disabled and its recovery source preserved.
- Keep READ_ONLY=true and previews disabled while importing/shared data is bound. Never substitute a placeholder D1 ID or silently provision a different database.
- Run Node 22.22, locked installs, typecheck, synthetic tests, production build and full local workerd authentication smoke after auth/platform changes. A successful bundle does not prove NextAuth sessions.
- No unsigned wallet headers, global fetch authentication interceptors, random-per-isolate session secrets, or inbound XMTP message writes under the receiver's identity.
- Data exports are private, ignored, mode 0600 in directories mode 0700. Read-only inventory, explicit table mapping, exact field/count/hash reconciliation and reverse rehearsal precede cutover. Never print credentials or rows into operational logs.
- The original source has five tables, with three chat tables absent. Use only
  the explicit `export-pg PRIVATE_DIRECTORY --source-mapping original-five-table-v1`
  option for that approved mapping; the default exporter still requires all eight
  tables. Unexpected source tables or column changes must stop export, not become
  implicit empty arrays. Neither export mode freezes writers or performs import.
- Keep all changes scoped and preserve current source drift. Never force-push or reset another checkout.
