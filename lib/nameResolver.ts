import { createPublicClient, http } from 'viem'
import { mainnet, base } from 'viem/chains'

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

const baseClient = createPublicClient({
  chain: base,
  transport: http()
})

export async function resolveENSName(address: string): Promise<string | null> {
  try {
    const ensName = await mainnetClient.getEnsName({
      address: address as `0x${string}`
    })
    return ensName
  } catch (error) {
    console.error('Failed to resolve ENS name:', error)
    return null
  }
}

export async function resolveBaseName(address: string): Promise<string | null> {
  try {
    // Base names are handled through their resolver
    // This is a simplified implementation - in production you'd use the proper Base name resolver
    const baseName = await baseClient.getEnsName({
      address: address as `0x${string}`
    })
    return baseName
  } catch (error) {
    console.error('Failed to resolve Base name:', error)
    return null
  }
}

export async function getDisplayName(address: string): Promise<string> {
  // Try ENS first
  const ensName = await resolveENSName(address)
  if (ensName) return ensName

  // Try Base name
  const baseName = await resolveBaseName(address)
  if (baseName) return baseName

  // Fallback to shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
