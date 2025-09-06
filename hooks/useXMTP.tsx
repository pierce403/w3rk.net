'use client'

import { useAddress, useSigner } from "thirdweb/react";
import { useEffect, useState } from 'react'
import { initializeXMTP, getXMTPClient, disconnectXMTP } from '../lib/xmtp'
import type { Signer, Identifier } from '@xmtp/browser-sdk'
import { hexToBytes } from 'viem'

/**
 * React hook for XMTP integration with Thirdweb wallet
 * Automatically initializes XMTP client when user is connected
 */
export function useXMTP() {
  const address = useAddress()
  const signer = useSigner()
  const [isXMTPReady, setIsXMTPReady] = useState(false)
  const [xmtpError, setXMTPError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    let mounted = true

    async function setupXMTP() {
      if (!address || !signer) {
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
        console.log('🔄 Initializing XMTP client for:', address)

        const accountIdentifier: Identifier = {
          identifier: address,
          identifierKind: "Ethereum",
        }

        const signMessage = async (message: string): Promise<Uint8Array> => {
          try {
            const signature = await signer.signMessage(message)
            return hexToBytes(signature)
          } catch (error) {
            console.error('❌ Failed to create XMTP signature:', error)
            throw error
          }
        }

        const xmtpSigner: Signer = {
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
  }, [address, signer, isInitializing])

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
    userAddress: address || null
  }
}