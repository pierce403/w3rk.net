'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'
import { useENSName } from '../hooks/useENSName'

export default function PrivyAuthButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { displayName } = useENSName(user?.wallet?.address)

  // Set up API interceptor to add wallet address to requests
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      const originalFetch = window.fetch
      
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        // Only add auth header for API calls
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/') && user?.wallet?.address) {
          const headers = new Headers(init?.headers)
          headers.set('x-wallet-address', user.wallet.address)
          
          return originalFetch(input, {
            ...init,
            headers,
          })
        }
        
        return originalFetch(input, init)
      }
      
      // Cleanup function to restore original fetch
      return () => {
        window.fetch = originalFetch
      }
    }
  }, [authenticated, user?.wallet?.address])

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
