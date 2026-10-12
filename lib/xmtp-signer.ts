import {hexToBytes,type Hex} from 'viem'
import type {Signer} from '@xmtp/browser-sdk'
import type {WalletType} from './wallet-signature'

type SigningAccount={address:string;signMessage:(input:{message:string;chainId?:number})=>Promise<Hex>}
type VerifiedSession={address?:string;chainId?:number;walletType?:WalletType}
export function createXMTPSigner(account:SigningAccount,session:VerifiedSession,activeChainId:number|undefined,isCurrent:()=>boolean):Signer {
  const {chainId,walletType}=session
  if(!session.address||account.address.toLowerCase()!==session.address.toLowerCase()||!walletType||!chainId)throw new Error('Sign in again to enable XMTP.')
  if(activeChainId!==chainId)throw new Error('Switch to your sign-in network to enable XMTP.')
  // Of the three app chains, XMTP supports SCWs on Ethereum and Base, not Base Sepolia.
  if(walletType==='SCW'&&![1,8453].includes(chainId))throw new Error('XMTP smart-wallet messaging is unavailable on this network. Database messaging remains available.')
  const shared={
    getIdentifier:()=>({identifier:account.address.toLowerCase(),identifierKind:'Ethereum' as const}),
    signMessage:async(message:string)=>{
      if(!isCurrent())throw new Error('Wallet or session changed.')
      const signature=await account.signMessage({message,chainId})
      if(!isCurrent())throw new Error('Wallet or session changed.')
      return hexToBytes(signature)
    },
  }
  // The pinned SDK requires synchronous bigint hooks. Omit getBlockNumber to use
  // XMTP's latest-block verification, rather than reusing a stale login block.
  return walletType==='SCW'?{...shared,type:'SCW',getChainId:()=>BigInt(chainId)}:{...shared,type:'EOA'}
}
export async function xmtpSignerKey(signer:Signer){
  return `${signer.type}:${signer.type==='SCW'?signer.getChainId():0n}:${(await signer.getIdentifier()).identifier.toLowerCase()}`
}
