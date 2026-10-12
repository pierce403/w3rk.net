import { SiweMessage } from 'siwe'
import {verifyWalletSignature,signatureClient,type SignatureClientFactory} from './wallet-signature'
import type {Address} from 'viem'
export const nonceLifetimeMs=5*60*1000
export const nonceCookie='w3rk-nonce'
export function cookieValue(header: string, name: string) {
  const part=header.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
  if(!part) return undefined
  try { return decodeURIComponent(part.slice(name.length+1)) } catch { return undefined }
}
export async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('')
}
export function authConfig(url: string|undefined, secret: string|undefined, chains: string|undefined) {
  if(!secret || secret.length<32) throw new Error('A stable NEXTAUTH_SECRET of at least 32 characters is required')
  if(!url) throw new Error('NEXTAUTH_URL is required')
  const origin=new URL(url)
  if(origin.protocol!=='https:' && !(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname))) throw new Error('HTTPS authentication origin required')
  if(origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password) throw new Error('NEXTAUTH_URL must be an origin')
  const allowedChains=(chains??'8453,84532,1').split(',').map(Number)
  if(!allowedChains.length || allowedChains.some(c=>!Number.isSafeInteger(c)||c<1)) throw new Error('Invalid AUTH_ALLOWED_CHAIN_IDS')
  return {origin:origin.origin,domain:origin.host,secret,allowedChains}
}
export async function verifyAndConsume(db:D1Database,input:{message:string;signature:string;cookie:string},config:ReturnType<typeof authConfig>,now=Date.now(),clientFor:SignatureClientFactory=signatureClient,clock:()=>number=Date.now) {
  try {
    if(input.message.length>16384||input.signature.length>4096) return null
    const token=cookieValue(input.cookie,nonceCookie)
    if(!token||!/^\w{64}$/.test(token)) return null
    const parsed=JSON.parse(input.message)
    const siwe=new SiweMessage(parsed)
    if(siwe.domain!==config.domain||siwe.uri!==config.origin||siwe.version!=='1'||!config.allowedChains.includes(siwe.chainId)) return null
    if(!siwe.issuedAt||!siwe.expirationTime||siwe.notBefore||siwe.resources?.length) return null
    const issued=Date.parse(siwe.issuedAt),expires=Date.parse(siwe.expirationTime)
    if(!Number.isFinite(issued)||!Number.isFinite(expires)||issued>now+10000||issued<now-nonceLifetimeMs||expires<=now||expires>issued+nonceLifetimeMs) return null
    const browserHash=await digest(token)
    const challenge=await db.prepare('SELECT expiresAt FROM auth_challenges WHERE nonce=? AND browserHash=? AND consumedAt IS NULL AND expiresAt>?').bind(siwe.nonce,browserHash,now).first<{expiresAt:number}>()
    if(!challenge||expires>challenge.expiresAt) return null
    // Keep SIWE parsing/field validation, but avoid siwe.verify's raw-signature error logger.
    const walletType=await verifyWalletSignature(siwe.address as Address,siwe.chainId,siwe.prepareMessage(),input.signature,clientFor)
    if(!walletType) return null
    // RPC verification can outlast a challenge; never consume against a stale clock.
    const verifiedAt=Math.max(now,clock())
    if(expires<=verifiedAt) return null
    // Consuming after signature verification with a conditional update makes concurrent replays single-use.
    const consumed=await db.prepare('UPDATE auth_challenges SET consumedAt=? WHERE nonce=? AND browserHash=? AND consumedAt IS NULL AND expiresAt>?').bind(verifiedAt,siwe.nonce,browserHash,verifiedAt).run()
    return consumed.meta.changes===1?{id:siwe.address,chainId:siwe.chainId,walletType}:null
  } catch { return null }
}
