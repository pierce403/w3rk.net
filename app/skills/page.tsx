import { headers } from 'next/headers'
import type { Skill } from '../../lib/data'
import EndorseButton from '../../components/EndorseButton'

export const dynamic = 'force-dynamic'

export default async function SkillsPage() {
  const host = headers().get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const res = await fetch(`${protocol}://${host}/api/skills`, { cache: 'no-store' })
  const skills: Skill[] = await res.json()

  return (
    <div className="card">
      <h2>Skills</h2>
      {skills.length === 0 ? (
        <p className="small">No skills claimed yet.</p>
      ) : (
        <ul style={{marginTop:20}} className="grid">
          {skills.map(s => (
            <li key={s.user + s.name} className="card" style={{listStyle:'none'}}>
              <strong>{s.name}</strong>
              <div className="small">User: {s.user}</div>
              <div className="small">Endorsements: {s.endorsements.length}</div>
              <EndorseButton user={s.user} name={s.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
