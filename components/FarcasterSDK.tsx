'use client'

import { useEffect } from 'react'

export default function FarcasterSDK() {
  useEffect(() => {
    // Initialize Farcaster MiniApp SDK when component mounts
    const initializeFarcasterSDK = async () => {
      try {
        // Check if we're running in a Farcaster context
        if (typeof window !== 'undefined' && window.location.hostname === 'w3rk.net') {
          // Dynamically import SDK to avoid SSR issues
          const { sdk } = await import('@farcaster/miniapp-sdk')
          
          // Wait for the app to be fully loaded
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve(true)
            } else {
              window.addEventListener('load', () => resolve(true))
            }
          })

          // Signal to Farcaster that the miniapp is ready
          await sdk.actions.ready()
          
          console.log('🟣 Farcaster MiniApp SDK initialized successfully')
          
          // Optional: Get context info if available
          const context = sdk.context
          if (context) {
            console.log('🟣 Farcaster context:', context)
          }
          
        }
      } catch (error) {
        // Silently handle errors - SDK might not be available in all contexts
        console.log('Farcaster SDK not available or failed to initialize:', error)
      }
    }

    initializeFarcasterSDK()
  }, [])

  // This component doesn't render anything visible
  return null
}
