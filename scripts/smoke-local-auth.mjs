import assert from 'node:assert/strict'
import {Wallet} from 'ethers'
import {SiweMessage} from 'siwe'
const base=process.env.TEST_ORIGIN??'http://localhost:5193'
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('This synthetic write test only runs on localhost')
const jar=new Map()
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));if(!headers.has('origin'))headers.set('origin',base)
 const response=await fetch(base+path,{...options,headers,redirect:'manual'})
 for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],at=pair.indexOf('=');jar.set(pair.slice(0,at),pair.slice(at+1))}
 return response
}
const jsonPost=data=>({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)})
let res=await request('/api/auth/csrf');assert.equal(res.status,200,'CSRF endpoint');const {csrfToken}=await res.json();assert.ok(csrfToken)
const wallet=Wallet.createRandom(),other=Wallet.createRandom()
res=await request('/api/jobs',{...jsonPost({title:'forged',budget:'1',desc:'forged'}),headers:{'content-type':'application/json','x-wallet-address':wallet.address}});assert.equal(res.status,401,'unsigned header rejected')
res=await request('/api/auth/nonce');assert.equal(res.status,200,'nonce endpoint');const challenge=await res.json()
assert.match(res.headers.get('set-cookie'),/HttpOnly/i);assert.match(res.headers.get('set-cookie'),/SameSite=Lax/i)
const message=new SiweMessage({domain:new URL(base).host,address:wallet.address,statement:'Sign in with Ethereum to w3rk.net',uri:base,version:'1',chainId:8453,...challenge})
const signature=await wallet.signMessage(message.prepareMessage())
const loginBody=new URLSearchParams({message:JSON.stringify(message),signature,csrfToken,callbackUrl:base,json:'true'})
res=await request('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:loginBody});assert.equal(res.status,200,'credential callback');const login=await res.json();assert.equal(new URL(login.url).searchParams.get('error'),null,'credentials accepted')
res=await request('/api/auth/session');assert.equal(res.status,200);assert.equal((await res.json()).address,wallet.address,'verified session')
res=await request('/api/jobs',{...jsonPost({title:'forged origin',budget:'1',desc:'x'}),headers:{'content-type':'application/json',origin:'https://evil.example'}});assert.equal(res.status,403,'cross-origin write rejected')
res=await request('/api/jobs',jsonPost({title:'Synthetic migration check',budget:'1',desc:'Local-only test'}));assert.equal(res.status,201,'authenticated write')
res=await request('/api/chat/rooms',jsonPost({type:'direct',title:'Local test',participantAddresses:[other.address]}));assert.equal(res.status,201);const room=await res.json()
res=await request(`/api/chat/rooms/${room.id}/messages`,jsonPost({content:'Local synthetic message'}));assert.equal(res.status,201)
res=await request(`/api/chat/rooms/${room.id}/messages`);assert.equal(res.status,200);assert.equal((await res.json())[0].sender.address,wallet.address)
res=await request('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:loginBody});assert.match((await res.json()).url,/CredentialsSignin/,'replayed nonce rejected')
res=await request('/api/auth/csrf');const logoutCSRF=(await res.json()).csrfToken
res=await request('/api/auth/signout',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:logoutCSRF,json:'true',callbackUrl:base})});assert.equal(res.status,200)
res=await request('/api/auth/session');assert.equal((await res.json()).address,undefined,'signout clears session')
res=await request(`/api/chat/rooms/${room.id}/messages`);assert.equal(res.status,401,'private messages require session')
console.log('PASS: local Worker CSRF, unsigned-header rejection, SIWE login, session, writes, chat, replay rejection, signout, private-read denial')
