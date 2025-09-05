'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import QRCode from 'qrcode'
import { useAppKit, useAppKitProvider, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'

export default function QRAuthButton() {
  const { data: session, status } = useSession()
  const { open } = useAppKit()
  const { walletProvider } = useAppKitProvider('eip155')
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const [isConnecting, setIsConnecting] = useState(false)

  async function handleSignIn() {
    if (!isConnected || !address || !walletProvider) {
      // Open WalletConnect modal for QR code scanning
      setIsConnecting(true)
      try {
        await open()
      } finally {
        setIsConnecting(false)
      }
      return
    }

    try {
      // Validate chain ID (Base networks preferred)
      const allowedChains = [8453, 84532, 1] // Base, Base Sepolia, Ethereum
      const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId) : chainId
      if (chainIdNumber && !allowedChains.includes(chainIdNumber)) {
        alert('Please switch to Base network (Chain ID: 8453) or Base Sepolia (Chain ID: 84532)')
        return
      }

      // Get nonce for SIWE
      const nonceRes = await fetch('/api/auth/nonce')
      const { nonce } = await nonceRes.json()
      
      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to w3rk.net',
        uri: window.location.origin,
        version: '1',
        chainId: chainIdNumber || 8453,
        nonce,
      })

      // Request signature via WalletConnect
      const signature = await (walletProvider as any).request({
        method: 'personal_sign',
        params: [message.prepareMessage(), address],
      })

      // Sign in with NextAuth
      const result = await signIn('credentials', { 
        message: JSON.stringify(message), 
        signature, 
        redirect: false 
      })

      if (result?.error) {
        alert('Sign in failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Failed to sign in. Please try again.')
    }
  }

  if (status === 'loading') {
    return <button className="btn small" disabled>Loading...</button>
  }

  if (session?.address) {
    return <button className="btn small" onClick={() => signOut()}>Sign out</button>
  }

  if (isConnected && address) {
    return <button className="btn small" onClick={handleSignIn}>Sign Message</button>
  }

  return (
    <button 
      className="btn small" 
      onClick={handleSignIn}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Scan to Sign In'}
    </button>
  )
}
