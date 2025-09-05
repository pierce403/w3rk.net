import type { Job } from '../api/jobs/route'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Jobs() {
  const host = headers().get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const res = await fetch(`${protocol}://${host}/api/jobs`, { cache: 'no-store' })
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
