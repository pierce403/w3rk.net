'use client'
import {useActiveAccount,useActiveWallet,useActiveWalletChain} from 'thirdweb/react'
import {useEffect,useState} from 'react'
import {useSession} from 'next-auth/react'
import {createXMTPSigner} from '../lib/xmtp-signer'
import {initializeXMTP,disconnectXMTP,getXMTPClient} from '../lib/xmtp'
export function useXMTP(){
  const account=useActiveAccount(),wallet=useActiveWallet(),chain=useActiveWalletChain(),{data:session}=useSession()
  const [isXMTPReady,setReady]=useState(false),[xmtpError,setError]=useState<string|null>(null),[isInitializing,setInitializing]=useState(false)
  useEffect(()=>{
    let active=true
    setReady(false);setError(null);setInitializing(false)
    if(!account||account.address.toLowerCase()!==session?.address?.toLowerCase()){disconnectXMTP();return}
    const isCurrent=()=>active&&wallet?.getAccount()?.address.toLowerCase()===account.address.toLowerCase()&&wallet?.getChain()?.id===session.chainId
    try {
      const signer=createXMTPSigner(account,session,chain?.id,isCurrent)
      setInitializing(true)
      void initializeXMTP(signer,isCurrent).then(c=>{if(active){setReady(!!c);if(!c)setError('XMTP unavailable; database messaging remains available.')}}).finally(()=>{if(active)setInitializing(false)})
    }catch(e){disconnectXMTP();setError(e instanceof Error?e.message:'XMTP unavailable; database messaging remains available.')}
    return()=>{active=false;disconnectXMTP()}
  },[account,wallet,chain?.id,session?.address,session?.chainId,session?.walletType])
  return{isXMTPReady,xmtpError,isInitializing,xmtpClient:getXMTPClient(),userAddress:account?.address??null}
}
