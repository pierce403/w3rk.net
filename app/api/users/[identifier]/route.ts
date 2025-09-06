import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getDisplayName } from '../../../../lib/nameResolver'

export async function GET(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params
    
    if (!identifier) {
      return NextResponse.json({ error: 'User identifier is required' }, { status: 400 })
    }

    let user = null

    // Try to find user by address first (most common case)
    if (identifier.startsWith('0x') && identifier.length === 42) {
      user = await prisma.user.findFirst({
        where: { 
          address: {
            equals: identifier,
            mode: 'insensitive'
          }
        }
      })
    } else {
      // If not an address, try to find by ENS/Base name in displayName field
      // In a full implementation, you'd also reverse-resolve ENS names to addresses
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { ensName: identifier },
            { baseName: identifier },
            { displayName: identifier }
          ]
        }
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the current display name (with ENS resolution)
    const currentDisplayName = await getDisplayName(user.address)

    // Return user data
    const userData = {
      id: user.id,
      address: user.address,
      displayName: currentDisplayName,
      ensName: user.ensName,
      baseName: user.baseName,
      farcasterHandle: user.farcasterHandle,
      bio: user.bio,
      createdAt: user.joinedAt
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
