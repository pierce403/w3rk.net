'use client'
import { ConnectButton, useActiveAccount, useActiveWallet, useActiveWalletChain, useDisconnect } from 'thirdweb/react'
import { base, baseSepolia, ethereum } from 'thirdweb/chains'
import { useSession,signIn,signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useState } from 'react'
import { thirdwebClient } from '../lib/thirdweb'
import { useENSName } from '../hooks/useENSName'
export default function ThirdwebAuthButton() {
  const account=useActiveAccount(),wallet=useActiveWallet(),chain=useActiveWalletChain(),{disconnect}=useDisconnect()
  const {data:session}=useSession(),{displayName}=useENSName(account?.address)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  async function login() {
    if(!account||!chain||!wallet)return
    setBusy(true);setError('')
    try {
      const res=await fetch('/api/auth/nonce',{cache:'no-store'})
      if(!res.ok)throw new Error(res.status===503?'Sign-in is paused during maintenance.':'Could not start sign-in.')
      const challenge=await res.json() as {nonce:string;issuedAt:string;expirationTime:string}
      const stillCurrent=()=>wallet.getAccount()?.address.toLowerCase()===account.address.toLowerCase()&&wallet.getChain()?.id===chain.id
      if(!stillCurrent())throw new Error('Wallet changed. Please sign in again.')
      const message=new SiweMessage({domain:location.host,address:account.address,statement:'Sign in with Ethereum to w3rk.net',uri:location.origin,version:'1',chainId:chain.id,...challenge})
      const signature=await account.signMessage({message:message.prepareMessage(),chainId:chain.id})
      if(!stillCurrent())throw new Error('Wallet changed. Please sign in again.')
      const result=await signIn('credentials',{message:JSON.stringify(message),signature,redirect:false})
      if(result?.error)throw new Error('Signature verification failed. Please try again.')
    } catch(e) {setError(e instanceof Error?e.message:'Sign-in failed.')} finally {setBusy(false)}
  }
  async function logout(){await signOut({redirect:false});if(wallet)disconnect(wallet)}
  return <div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
    {thirdwebClient?<ConnectButton client={thirdwebClient} chain={base} chains={[base,baseSepolia,ethereum]} />:<span>Wallet connection is not configured.</span>}
    {session?.address?<><a href={`/u/${session.address}`}>{displayName||`${session.address.slice(0,6)}...${session.address.slice(-4)}`}</a><button className="btn small" onClick={logout}>Sign out</button></>:account&&<button className="btn small" disabled={busy} onClick={login}>{busy?'Signing in...':'Sign in'}</button>}
    {error&&<span role="alert">{error}</span>}
  </div>
}
