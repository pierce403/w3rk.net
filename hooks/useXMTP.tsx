'use client'
import {useActiveAccount} from 'thirdweb/react'
import {useEffect,useState} from 'react'
import {useSession} from 'next-auth/react'
import {hexToBytes} from 'viem'
import {type Signer} from '@xmtp/browser-sdk'
import {initializeXMTP,disconnectXMTP,getXMTPClient} from '../lib/xmtp'
export function useXMTP(){
  const account=useActiveAccount(),{data:session}=useSession()
  const [isXMTPReady,setReady]=useState(false),[xmtpError,setError]=useState<string|null>(null),[isInitializing,setInitializing]=useState(false)
  useEffect(()=>{
    let active=true
    setReady(false);setError(null)
    if(!account||account.address.toLowerCase()!==session?.address?.toLowerCase()){disconnectXMTP();return}
    setInitializing(true)
    const signer:Signer={type:'EOA',getIdentifier:()=>({identifier:account.address,identifierKind:'Ethereum' as const}),signMessage:async message=>hexToBytes(await account.signMessage({message}))}
    void initializeXMTP(signer).then(c=>{if(active){setReady(!!c);if(!c)setError('XMTP unavailable; database messaging remains available.')}}).finally(()=>{if(active)setInitializing(false)})
    return()=>{active=false;disconnectXMTP()}
  },[account,session?.address])
  return{isXMTPReady,xmtpError,isInitializing,xmtpClient:getXMTPClient(),userAddress:account?.address??null}
}
