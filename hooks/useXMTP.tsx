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

      // Check if XMTP is already initialized
      if (getXMTPClient()) {
        setIsXMTPReady(true)
        return
      }

      try {
        setXMTPError(null)
        
        // Get Privy's embedded wallet signer for XMTP
        const wallet = user.wallet
        if (!wallet) {
          throw new Error('No wallet available')
        }

        // Initialize XMTP with wallet signer
        // Note: This requires the user's wallet to be unlocked
        const client = await initializeXMTP(wallet.address)
        
        if (mounted) {
          setIsXMTPReady(!!client)
          if (!client) {
            setXMTPError('XMTP initialization failed - messaging will use database only')
          }
        }
      } catch (error) {
        console.error('XMTP setup error:', error)
        if (mounted) {
          setXMTPError(error instanceof Error ? error.message : 'XMTP setup failed')
          setIsXMTPReady(false)
        }
      }
    }

    setupXMTP()

    return () => {
      mounted = false
    }
  }, [authenticated, user?.wallet?.address])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectXMTP()
    }
  }, [])

  return {
    isXMTPReady,
    xmtpError,
    xmtpClient: getXMTPClient(),
    userAddress: user?.wallet?.address || null
  }
}
