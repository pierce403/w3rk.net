'use client'

import { useAddress } from "thirdweb/react";

// Custom hook that provides NextAuth-like interface using Thirdweb
export function useUnifiedAuth() {
  const address = useAddress()

  const session = address ? { address } : null

  return {
    data: session,
    status: address ? 'authenticated' : 'unauthenticated'
  }
}
