import type { Service } from '../../lib/data'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Services() {
  const host = headers().get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const res = await fetch(`${protocol}://${host}/api/services`, { cache: 'no-store' })
  const services: Service[] = await res.json()

  return (
    <div className="card">
      <h2>Services</h2>
      {services.length === 0 ? (
        <p className="small">No services advertised yet.</p>
      ) : (
        <ul style={{marginTop:20}} className="grid">
          {services.map(s => (
            <li key={s.id} className="card" style={{listStyle:'none'}}>
              <strong>{s.title}</strong>
              <div className="small">Rate: {s.rate}</div>
              <p className="small">{s.desc}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
