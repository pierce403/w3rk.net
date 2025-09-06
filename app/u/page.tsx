'use client'

import { useEffect, useState } from 'react'
import { getRecentUsers, UserProfile } from '../../lib/userData'

export default function UsersDirectory() {
  const [users, setUsers] = useState<UserProfile[]>([])

  useEffect(() => {
    setUsers(getRecentUsers())
  }, [])

  return (
    <div className="card">
      <h2>Recently Joined Users</h2>
      <p>Welcome to the w3rk.net community! Connect with other builders and workers.</p>
      
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {users.map(user => (
          <div key={user.address} className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
                  <a href={`/u/${user.ensName || user.baseName || user.address}`} style={{ textDecoration: 'none' }}>
                    {user.displayName}
                  </a>
                </h3>
                {user.bio && (
                  <p style={{ margin: 0, marginBottom: '0.5rem', color: '#666' }}>
                    {user.bio}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#888' }}>
                  <span>Joined {user.joinedAt.toLocaleDateString()}</span>
                  {user.farcasterHandle && (
                    <a 
                      href={`https://warpcast.com/${user.farcasterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#8a63d2' }}
                    >
                      @{user.farcasterHandle}
                    </a>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {users.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
          No users found. Be the first to join!
        </p>
      )}
    </div>
  )
}
