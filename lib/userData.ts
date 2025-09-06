export interface UserProfile {
  address: string
  ensName?: string
  baseName?: string
  displayName: string
  farcasterHandle?: string
  joinedAt: Date
  bio?: string
}

// In-memory user storage (replace with database in production)
export const userProfiles: UserProfile[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    ensName: 'deanpierce.eth',
    displayName: 'deanpierce.eth',
    farcasterHandle: 'deanpierce',
    joinedAt: new Date('2024-01-15'),
    bio: 'Building the future of work on Base'
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    baseName: 'alice.base.eth',
    displayName: 'alice.base.eth',
    farcasterHandle: 'alicebuilds',
    joinedAt: new Date('2024-02-01'),
    bio: 'Smart contract developer and DeFi enthusiast'
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    displayName: '0x3456...9012', // Shortened address when no ENS/Base name
    joinedAt: new Date('2024-02-15'),
    bio: 'Web3 designer and UI/UX specialist'
  }
]

export function getUserByAddress(address: string): UserProfile | undefined {
  return userProfiles.find(user => user.address.toLowerCase() === address.toLowerCase())
}

export function getUserByName(name: string): UserProfile | undefined {
  return userProfiles.find(user => 
    user.ensName === name || 
    user.baseName === name ||
    user.displayName === name
  )
}

export function createUserProfile(address: string): UserProfile {
  const existing = getUserByAddress(address)
  if (existing) return existing

  const newUser: UserProfile = {
    address,
    displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
    joinedAt: new Date()
  }
  
  userProfiles.push(newUser)
  return newUser
}

export function getRecentUsers(): UserProfile[] {
  return userProfiles
    .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
    .slice(0, 20)
}
