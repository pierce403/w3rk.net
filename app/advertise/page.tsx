'use client'

import { useState } from 'react'
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth'

export default function Advertise() {
  const { data: session } = useUnifiedAuth()
  const [title, setTitle] = useState('')
  const [rate, setRate] = useState('')
  const [desc, setDesc] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, rate, desc }),
    })
    window.location.href = '/s'
  }

  if (!session?.address) {
    return <div className="card"><p>Please sign in to advertise a service.</p></div>
  }

  return (
    <div className="card">
      <h2>Advertise a service</h2>
      <form onSubmit={submit}>
        <div style={{display: 'grid', gap: 12}}>
          <label>Title <br/><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Smart contract audit" /></label>
          <label>Rate (USDC) <br/><input value={rate} onChange={e=>setRate(e.target.value)} placeholder="e.g., 100/hr" /></label>
          <label>Description <br/><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={6} placeholder="What do you offer?"/></label>
        </div>
        <div style={{marginTop: 14}}>
          <button className="btn" type="submit">Create</button>
          <a className="btn secondary" href="/">Cancel</a>
        </div>
      </form>
    </div>
  )
}
