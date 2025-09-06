'use client'

import { usePrivy } from '@privy-io/react-auth'

export default function FarcasterAuthButton() {
  const { login, logout, ready, authenticated, user } = usePrivy()

  // Don't render until Privy is ready
  if (!ready) {
    return (
      <button className="btn" disabled style={{opacity: 0.6}}>
        Loading...
      </button>
    )
  }

  // If user is authenticated, show their info and logout option
  if (authenticated && user) {
    // Check if user has Farcaster account connected
    const farcasterAccount = user.linkedAccounts.find(
      account => account.type === 'farcaster'
    )

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {farcasterAccount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#8a63d2' }}>🟣</span>
            <span style={{ fontSize: '0.875rem' }}>
              @{farcasterAccount.username || `fid:${farcasterAccount.fid}`}
            </span>
          </div>
        )}
        <button 
          className="btn small secondary" 
          onClick={logout}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Show login button
  return (
    <button 
      className="btn" 
      onClick={() => login({ 
        loginMethods: ['farcaster'],
      })}
      style={{ 
        backgroundColor: '#8a63d2', 
        color: 'white',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        padding: '0.875rem 1.5rem'
      }}
    >
      <span>🟣</span>
      Continue with Farcaster
    </button>
  )
}
