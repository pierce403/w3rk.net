'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'

export default function AuthButton() {
  const { data: session, status } = useSession()

  async function login() {
    // Check for various wallet providers (Base app, MetaMask, etc.)
    const provider = (window as any).ethereum || (window as any).web3?.currentProvider
    if (!provider) {
      alert('Please install a wallet or use the Base app to sign in')
      return
    }

    try {
      // Request account access
      await provider.request({ method: 'eth_requestAccounts' })
      
      // Get the connected address
      const accounts = await provider.request({ method: 'eth_accounts' })
      const address = accounts[0]
      
      if (!address) {
        alert('No account found. Please connect your wallet.')
        return
      }

      // Get the current chain ID
      const chainId = await provider.request({ method: 'eth_chainId' })
      const chainIdNumber = parseInt(chainId, 16)
      
      // Base Mainnet: 8453, Base Sepolia: 84532, allow Ethereum for fallback: 1
      const allowedChains = [8453, 84532, 1]
      if (!allowedChains.includes(chainIdNumber)) {
        alert('Please switch to Base network (Chain ID: 8453) or Base Sepolia (Chain ID: 84532)')
        return
      }

      // Get nonce for SIWE
      const nonceRes = await fetch('/api/auth/nonce')
      const { nonce } = await nonceRes.json()
      
      // Create SIWE message with current chain ID
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
      const signature = await provider.request({
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

  if (status === 'loading') return null
  if (session?.address) {
    return <button className="btn small" onClick={() => signOut()}>Sign out</button>
  }
  return <button className="btn small" onClick={login}>Sign in</button>
}
