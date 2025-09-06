'use client'

import { useAddress } from "thirdweb/react";
import { useEffect } from 'react'

/**
 * Global authentication provider that sets up API request interceptors
 * for wallet authentication. This ensures all API calls include
 * the x-wallet-address header when user is connected.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const address = useAddress()

  // Global API interceptor to add wallet address to all API requests
  useEffect(() => {
    if (address) {
      const originalFetch = window.fetch

      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === 'string' ? input : input.toString()

        if (url.includes('/api/')) {
          const headers = new Headers(init?.headers)
          headers.set('x-wallet-address', address)

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
  }, [address])

  return <>{children}</>
}
