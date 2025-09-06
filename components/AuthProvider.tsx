'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'

/**
 * Global authentication provider that sets up API request interceptors
 * for Privy wallet authentication. This ensures all API calls include
 * the x-wallet-address header when user is authenticated with Privy.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user } = usePrivy()

  // Global API interceptor to add wallet address to all API requests
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      const originalFetch = window.fetch
      
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        // Only add auth header for API calls to our own API
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

  // Also handle Farcaster authentication
  useEffect(() => {
    if (authenticated && user?.linkedAccounts) {
      const farcasterAccount = user.linkedAccounts.find(
        account => account.type === 'farcaster'
      )
      
      if (farcasterAccount && !user.wallet?.address) {
        // For Farcaster-only users, we might need different handling
        // For now, we'll let them through without a wallet address
        console.log('Farcaster user authenticated:', farcasterAccount.username || farcasterAccount.fid)
      }
    }
  }, [authenticated, user?.linkedAccounts, user?.wallet?.address])

  return <>{children}</>
}
