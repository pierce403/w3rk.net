import type { Job } from '../api/jobs/route'

export default async function Jobs() {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const res = await fetch(`${base}/api/jobs`, { cache: 'no-store' })
  const jobs: Job[] = await res.json()

  return (
    <div className="card">
      <h2>Jobs</h2>
      {jobs.length === 0 ? (
        <p className="small">No jobs posted yet.</p>
      ) : (
        <ul style={{marginTop:20}} className="grid">
          {jobs.map(j => (
            <li key={j.id} className="card" style={{listStyle:'none'}}>
              <strong>{j.title}</strong>
              <div className="small">Budget: {j.budget}</div>
              <p className="small">{j.desc}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
