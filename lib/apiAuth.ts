import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getAuthenticatedUser(req: NextRequest): Promise<string | null> {
  // First, try NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.address) {
    return session.address
  }

  // Then, try wallet authentication header
  const authHeader = req.headers.get('x-wallet-address')
  if (authHeader && isValidWalletAddress(authHeader)) {
    return authHeader
  }

  return null
}

function isValidWalletAddress(address: string): boolean {
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
