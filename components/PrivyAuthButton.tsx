'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'
import { useENSName } from '../hooks/useENSName'

export default function PrivyAuthButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { displayName } = useENSName(user?.wallet?.address)

  // Note: API interceptor moved to global AuthProvider

  if (!ready) {
    return <button className="btn small" disabled>Loading...</button>
  }

  if (authenticated && user) {
    const userDisplayName = displayName || 
      (user.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'Connected')
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a 
          href={`/u/${user.wallet?.address}`} 
          style={{ fontSize: '0.875rem', textDecoration: 'none', color: '#666' }}
        >
          {userDisplayName}
        </a>
        <button className="btn small" onClick={logout}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button 
      className="btn small" 
      onClick={() => login()}
      title="Connect with wallet (QR code or browser extension)"
    >
      🔗 Connect Wallet
    </button>
  )
}
