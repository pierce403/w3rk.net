'use client'

import { useSession } from 'next-auth/react'

export default function EndorseButton({ user, name }: { user: string; name: string }) {
  const { data: session } = useSession()
  async function endorse() {
    await fetch('/api/skills/endorse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, name }),
    })
    window.location.reload()
  }
  if (!session?.address || session.address === user) return null
  return <button className="btn small" onClick={endorse}>Endorse</button>
}
