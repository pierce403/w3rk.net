'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'

export default function SimpleAuthButton() {
  const { data: session, status } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)

  async function connectWallet() {
    setIsConnecting(true)
    
    try {
      // Check for browser wallet (MetaMask, Base wallet extension, etc.)
      const ethereum = (window as any).ethereum
      if (!ethereum) {
        alert('Please install MetaMask, Base wallet extension, or another browser wallet')
        return
      }

      // Request wallet connection
      await ethereum.request({ method: 'eth_requestAccounts' })
      
      // Get connected address
      const accounts = await ethereum.request({ method: 'eth_accounts' })
      const address = accounts[0]
      
      if (!address) {
        alert('No wallet connected')
        return
      }

      // Get current chain
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      const chainIdNumber = parseInt(chainId, 16)
      
      // Validate network (Base preferred)
      const allowedChains = [8453, 84532, 1] // Base, Base Sepolia, Ethereum
      if (!allowedChains.includes(chainIdNumber)) {
        alert('Please switch to Base network in your wallet')
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
        chainId: chainIdNumber,
        nonce,
      })

      // Request signature
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message.prepareMessage(), address],
      })

      // Sign in
      const result = await signIn('credentials', { 
        message: JSON.stringify(message), 
        signature, 
        redirect: false 
      })

      if (result?.error) {
        alert('Sign in failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      if (error.code === 4001) {
        alert('Connection rejected by user')
      } else {
        alert('Failed to connect wallet. Please try again.')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  if (status === 'loading') {
    return <button className="btn small" disabled>Loading...</button>
  }

  if (session?.address) {
    return <button className="btn small" onClick={() => signOut()}>Sign out</button>
  }

  return (
    <button 
      className="btn small" 
      onClick={connectWallet}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
