export default function Home() {
  return (
    <div className="card">
      <h1>Welcome to <span className="badge">w3rk.net</span></h1>
      <p>
        This is the super‑simple MVP shell. It&apos;s production‑deployable on Vercel and ready
        to evolve into a Mini App with escrow, XMTP chat, and an Active Seeker Dividend (ASD).
      </p>
      <p>
        Start by editing <code>app/page.tsx</code>. Then add routes under <code>app/</code> for real features.
      </p>
      <div style={{marginTop: 18}}>
        <a className="btn" href="/post">Post a job</a>
        <a className="btn secondary" href="/jobs">Browse jobs</a>
        <a className="btn secondary" href="/profile">Profile</a>
      </div>
      <ul style={{marginTop: 22}} className="small">
        <li>Framework: Next.js App Router</li>
        <li>Zero server config needed on Vercel</li>
        <li>Health check at <code>/api/health</code></li>
      </ul>
    </div>
  )
}
