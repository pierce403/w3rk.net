'use client'

import { usePrivy } from '@privy-io/react-auth'

// Custom hook that provides NextAuth-like interface using Privy
export function useUnifiedAuth() {
  const { ready, authenticated, user } = usePrivy()

  // Extract wallet address from Privy user
  const address = user?.wallet?.address

  // Create a session-like object that matches NextAuth interface
  const session = authenticated && address ? {
    address,
    // Note: Privy doesn't expose chainId in the same way, but address is the main thing we need
  } : null

  return {
    data: session,
    status: ready ? (authenticated ? 'authenticated' : 'unauthenticated') : 'loading'
  }
}
