'use client'

import { useActiveAccount } from "thirdweb/react";

// Custom hook that provides NextAuth-like interface using Thirdweb
export function useUnifiedAuth() {
  const account = useActiveAccount()
  const address = account?.address

  const session = address ? { address } : null

  return {
    data: session,
    status: address ? 'authenticated' : 'unauthenticated'
  }
}
