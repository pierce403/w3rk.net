import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'
test('worker upgrades erase legacy caches and never intercept private routes or navigation',async()=>{
 const handlers=new Map<string,(event:Record<string,unknown>)=>void>(),deleted:string[]=[]
 const self={location:{origin:'https://w3rk.net'},addEventListener:(name:string,fn:(event:Record<string,unknown>)=>void)=>handlers.set(name,fn),skipWaiting:async()=>{},clients:{claim:async()=>{}}}
 // Both named legacy caches come from the retained61c58ae next-pwa build.
 const caches={keys:async()=>['start-url','w3rk-cache','workbox-precache-v2','w3rk-public-v1','w3rk-public-v2','w3rk-public-v3','unrelated'],delete:async(name:string)=>{deleted.push(name)}}
 runInNewContext(await readFile('public/sw.js','utf8'),{self,caches,URL})
 let activation:Promise<void>|undefined
 handlers.get('activate')!({waitUntil:(p:Promise<void>)=>{activation=p}});await activation
 assert.deepEqual(deleted,['start-url','w3rk-cache','workbox-precache-v2','w3rk-public-v1','w3rk-public-v2'])
 for(const path of ['/api/auth/session','/api/chat/rooms','/api/jobs','/profile','/chat/abc','/u/alice','/j']){
  let intercepted=false
  handlers.get('fetch')!({request:{method:'GET',url:'https://w3rk.net'+path,mode:'cors',headers:new Headers()},respondWith:()=>{intercepted=true}})
  assert.equal(intercepted,false,path)
 }
})
