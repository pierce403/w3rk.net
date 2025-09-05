'use client'

import { useState } from 'react'

export default function PostJob() {
  const [title, setTitle] = useState('')
  const [budget, setBudget] = useState('')
  const [desc, setDesc] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    alert('This is a static starter. Wire this form to your contracts or an API.')
  }

  return (
    <div className="card">
      <h2>Post a job</h2>
      <form onSubmit={submit}>
        <div style={{display: 'grid', gap: 12}}>
          <label>Title <br/><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Build a Base Mini App" /></label>
          <label>Budget (USDC) <br/><input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g., 500" /></label>
          <label>Description <br/><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={6} placeholder="What do you need? Milestones? Deadline?"/></label>
        </div>
        <div style={{marginTop: 14}}>
          <button className="btn" type="submit">Create draft</button>
          <a className="btn secondary" href="/">Cancel</a>
        </div>
      </form>
    </div>
  )
}
