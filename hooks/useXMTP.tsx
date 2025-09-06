'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { initializeXMTP, getXMTPClient, disconnectXMTP } from '../lib/xmtp'
import type { Signer, Identifier, IdentifierKind } from '@xmtp/browser-sdk'

/**
 * React hook for XMTP integration with Privy wallet
 * Automatically initializes XMTP client when user is authenticated
 */
export function useXMTP() {
  const { authenticated, user } = usePrivy()
  const [isXMTPReady, setIsXMTPReady] = useState(false)
  const [xmtpError, setXMTPError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    let mounted = true

    async function setupXMTP() {
      if (!authenticated || !user?.wallet?.address) {
        if (getXMTPClient()) {
          disconnectXMTP()
          setIsXMTPReady(false)
        }
        return
      }

      // Check if XMTP is already initialized for this wallet
      if (getXMTPClient()) {
        setIsXMTPReady(true)
        return
      }

      // Don't initialize multiple times
      if (isInitializing) return
      
      setIsInitializing(true)
      
      try {
        setXMTPError(null)
        console.log('🔄 Initializing XMTP client for:', user.wallet.address)
        
        // Create proper XMTP v3 signer using Privy wallet
        const accountIdentifier: Identifier = {
          identifier: user.wallet.address,
          identifierKind: "Ethereum",
        }

        // Create proper signing function
        const signMessage = async (message: string): Promise<Uint8Array> => {
          try {
            console.log('📝 Signing XMTP message with Privy wallet...')
            
            // TODO: Implement proper Privy wallet signing
            // For now, create a deterministic signature based on user address and message
            // This is a temporary solution until we figure out the correct Privy signing API
            console.warn('🚧 Using temporary XMTP signing implementation')
            
            const encoder = new TextEncoder()
            const messageBytes = encoder.encode(message + user.wallet!.address)
            
            // Create a deterministic but unique signature
            const hash = await crypto.subtle.digest('SHA-256', messageBytes)
            const signatureBytes = new Uint8Array(hash.slice(0, 32)) // Take first 32 bytes
            
            console.log('✅ Temporary signature created for XMTP')
            return signatureBytes
          } catch (error) {
            console.error('❌ Failed to create XMTP signature:', error)
            throw error
          }
        }

        // Create appropriate signer based on wallet type
        const xmtpSigner: Signer = user.wallet.walletClientType === 'privy' 
          ? {
              type: 'SCW',
              getIdentifier: () => accountIdentifier,
              signMessage,
              getChainId: () => BigInt(8453), // Base chain ID
            }
          : {
              type: 'EOA',
              getIdentifier: () => accountIdentifier,
              signMessage,
            }

        // Initialize XMTP client with the proper signer
        const client = await initializeXMTP(xmtpSigner)
        
        if (mounted) {
          setIsXMTPReady(!!client)
          if (client) {
            console.log('✅ XMTP client ready for cross-app messaging')
          } else {
            setXMTPError('XMTP signing integration needed - messaging will use database only')
          }
        }
      } catch (error) {
        console.error('❌ XMTP setup error:', error)
        if (mounted) {
          setXMTPError('XMTP requires wallet signing setup - using database messaging for now')
          setIsXMTPReady(false)
        }
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    setupXMTP()

    return () => {
      mounted = false
    }
  }, [authenticated, user?.wallet?.address, isInitializing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectXMTP()
    }
  }, [])

  return {
    isXMTPReady,
    xmtpError,
    isInitializing,
    xmtpClient: getXMTPClient(),
    userAddress: user?.wallet?.address || null
  }
}