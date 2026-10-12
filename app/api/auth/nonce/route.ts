import { env } from 'cloudflare:workers'
import { NextResponse } from 'next/server'
import { digest, nonceCookie, nonceLifetimeMs, authConfig } from '../../../../lib/siwe'
import { handle, writable } from '../../../../lib/http'
export const GET = () => handle(async()=>{
  writable()
  const config=authConfig(env.NEXTAUTH_URL,env.NEXTAUTH_SECRET,env.AUTH_ALLOWED_CHAIN_IDS)
  const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')
  const nonce=random(),token=random(),now=Date.now(),expiresAt=now+nonceLifetimeMs
  await env.DB.batch([
    env.DB.prepare('DELETE FROM auth_challenges WHERE expiresAt<?').bind(now),
    env.DB.prepare('INSERT INTO auth_challenges (nonce,browserHash,expiresAt) VALUES (?,?,?)').bind(nonce,await digest(token),expiresAt),
  ])
  const res=NextResponse.json({nonce,issuedAt:new Date(now).toISOString(),expirationTime:new Date(expiresAt).toISOString()},{headers:{'Cache-Control':'private, no-store'}})
  res.cookies.set(nonceCookie,token,{httpOnly:true,secure:config.origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:nonceLifetimeMs/1000})
  return res
})
