'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'

export default function AuthButton() {
  const { data: session, status } = useSession()

  async function login() {
    const { ethereum } = window as any
    if (!ethereum) return
    await ethereum.request({ method: 'eth_requestAccounts' })
    const address = (await ethereum.request({ method: 'eth_accounts' }))[0]
    const nonceRes = await fetch('/api/auth/nonce')
    const { nonce } = await nonceRes.json()
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Ethereum to w3rk.net',
      uri: window.location.origin,
      version: '1',
      chainId: 1,
      nonce,
    })
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message.prepareMessage(), address],
    })
    await signIn('credentials', { message: JSON.stringify(message), signature, redirect: false })
  }

  if (status === 'loading') return null
  if (session?.address) {
    return <button className="btn small" onClick={() => signOut()}>Sign out</button>
  }
  return <button className="btn small" onClick={login}>Sign in</button>
}
