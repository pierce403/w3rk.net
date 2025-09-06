'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useENSName } from '../hooks/useENSName'

export default function BaseAuthButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { displayName } = useENSName(user?.wallet?.address)

  if (!ready) {
    return (
      <button className="btn" disabled style={{ opacity: 0.6 }}>
        Loading...
      </button>
    )
  }

  if (authenticated && user) {
    const userDisplayName = displayName || 
      (user.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'Connected')
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#10b981' 
          }} />
          <a 
            href={`/u/${user.wallet?.address}`} 
            style={{ 
              fontSize: '0.875rem', 
              textDecoration: 'none', 
              color: '#374151', 
              fontWeight: '500' 
            }}
          >
            {userDisplayName}
          </a>
        </div>
        <button 
          className="btn small secondary" 
          onClick={logout}
          style={{ fontSize: '0.8rem' }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button 
      className="btn" 
      onClick={() => login()}
      style={{ 
        backgroundColor: '#0052ff', 
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
      <span>🔵</span>
      Continue with Base (Coinbase)
    </button>
  )
}
