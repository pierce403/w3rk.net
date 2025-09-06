'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { initializeXMTP, getXMTPClient, disconnectXMTP } from '../lib/xmtp'

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
        
        // For now, we'll create a simple signer interface
        // In a full implementation, this would integrate with Privy's signing capabilities
        const walletSigner = {
          getAddress: async () => user.wallet!.address,
          signMessage: async (message: string) => {
            // For now, we'll skip the actual signing since it requires more complex integration
            // This would normally use Privy's wallet.sign() method
            console.log('📝 Would sign message:', message)
            throw new Error('Message signing not yet implemented - XMTP client setup deferred')
          }
        }

        // Initialize XMTP client with the signer
        const client = await initializeXMTP(walletSigner)
        
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