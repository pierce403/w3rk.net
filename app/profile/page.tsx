'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Skill } from '../../lib/data'

export default function Profile() {
  const { data: session } = useSession()
  const [skill, setSkill] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    if (session?.address) {
      fetch(`/api/skills?user=${session.address}`).then(r => r.json()).then(setSkills)
    }
  }, [session])

  async function addSkill(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: skill }),
    })
    setSkill('')
    const res = await fetch(`/api/skills?user=${session?.address}`)
    setSkills(await res.json())
  }

  if (!session?.address) {
    return <div className="card"><p>Please sign in to manage your profile.</p></div>
  }

  return (
    <div className="card">
      <h2>Your Profile</h2>
      <form onSubmit={addSkill} style={{marginTop:12}}>
        <label>New Skill<br/><input value={skill} onChange={e=>setSkill(e.target.value)} /></label>
        <button className="btn small" type="submit" style={{marginLeft:8}}>Add</button>
      </form>
      <ul style={{marginTop:20}}>
        {skills.map(s => (
          <li key={s.name}>{s.name} — {s.endorsements.length} endorsement(s)</li>
        ))}
      </ul>
    </div>
  )
}
