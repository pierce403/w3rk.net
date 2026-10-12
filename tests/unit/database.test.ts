import test,{before,after} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {Miniflare,convertV4MiniflareOptions} from 'miniflare'
import {Wallet} from 'ethers'
import {SiweMessage} from 'siwe'
import {Repository,HttpError} from '../../lib/repository'
import {authConfig,verifyAndConsume as verifyWithRPC,digest,nonceCookie} from '../../lib/siwe'
import {contractWallet} from '../helpers/contract-wallet'
import type {Address} from 'viem'
const verifyAndConsume=(...args:Parameters<typeof verifyWithRPC>)=>verifyWithRPC(args[0],args[1],args[2],args[3],args[4]??(()=>null),args[5])
let mf:Miniflare,db:D1Database,repo:Repository
const alice=Wallet.createRandom(),bob=Wallet.createRandom(),outsider=Wallet.createRandom()
before(async()=>{
 mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-10-12',d1Databases:['DB']}))
 db=await mf.getD1Database('DB');repo=new Repository(db)
 await db.exec(await readFile('migrations/0001_application.sql','utf8'))
})
after(async()=>{await mf?.dispose()})
test('atomic user+listing creation and case-insensitive address lookup',async()=>{
 const job=await repo.createListing('jobs',alice.address,'Help','10','A task')
 assert.equal(job.user.address,alice.address)
 assert.equal((await repo.user(alice.address.toLowerCase()))?.address,alice.address)
 await repo.createListing('services',alice.address.toLowerCase(),'Service','20','A service')
 assert.equal((await repo.rows('SELECT id FROM users')).length,1)
})
test('duplicate skills and endorsements preserve unique identities',async()=>{
 const first=await repo.createSkill(alice.address,'Testing'),second=await repo.createSkill(alice.address.toLowerCase(),'Testing')
 assert.equal(first.created,true);assert.equal(second.created,false);assert.equal(first.skill.id,second.skill.id)
 await repo.endorse(bob.address,alice.address,'Testing')
 await assert.rejects(()=>repo.endorse(bob.address,alice.address,'Testing'),e=>e instanceof HttpError&&e.status===400)
})
test('room creation deduplicates addresses and rolls back all writes on foreign-key failure',async()=>{
 const room=await repo.createRoom(alice.address,{type:'direct',title:null,jobId:null,serviceId:null,participantAddresses:[alice.address.toLowerCase(),bob.address,bob.address.toLowerCase()]})
 assert.equal(room.participants.length,2)
 const count=(await repo.rows('SELECT id FROM chat_rooms')).length
 await assert.rejects(()=>repo.createRoom(outsider.address,{type:'job',title:null,jobId:'missing',serviceId:null,participantAddresses:[]}))
 assert.equal(await repo.user(outsider.address),null)
 assert.equal((await repo.rows('SELECT id FROM chat_rooms')).length,count)
})
test('message access is membership restricted and message+timestamp batch rolls back',async()=>{
 const room=(await repo.rooms(alice.address))[0]
 await assert.rejects(()=>repo.messages(room.id,outsider.address),e=>e instanceof HttpError&&e.status===403)
 await assert.rejects(()=>repo.createMessage(room.id,outsider.address,'forged',null),e=>e instanceof HttpError&&e.status===403)
 await db.exec("CREATE TRIGGER reject_room_update BEFORE UPDATE ON chat_rooms BEGIN SELECT RAISE(ABORT,'test rollback'); END;")
 await assert.rejects(()=>repo.createMessage(room.id,alice.address,'not saved',null))
 assert.equal((await repo.messages(room.id,alice.address)).length,0)
 await db.exec('DROP TRIGGER reject_room_update;')
 const message=await repo.createMessage(room.id,alice.address,'saved',null)
 assert.equal(message.sender.address,alice.address)
 assert.equal((await repo.messages(room.id,bob.address)).length,1)
 assert.equal((await repo.room(room.id)).updatedAt,message.createdAt)
})
const config=authConfig('https://w3rk.net','synthetic-test-secret-never-used-in-production','8453,84532,1')
async function challenge(changes:Record<string,unknown>={}){
 const now=Date.now(),nonce=crypto.randomUUID().replaceAll('-',''),cookie=crypto.randomUUID().replaceAll('-','').repeat(2)
 await db.prepare('INSERT INTO auth_challenges(nonce,browserHash,expiresAt) VALUES(?,?,?)').bind(nonce,await digest(cookie),now+300000).run()
 const message=new SiweMessage({domain:'w3rk.net',address:alice.address,statement:'Sign in with Ethereum to w3rk.net',uri:'https://w3rk.net',version:'1',chainId:8453,nonce,issuedAt:new Date(now).toISOString(),expirationTime:new Date(now+300000).toISOString(),...changes})
 return{message:JSON.stringify(message),signature:await alice.signMessage(message.prepareMessage()),cookie:`unrelated=value=padding; ${nonceCookie}=${cookie}`,nonce}
}
test('SIWE requires configured stable secret, correct domain, URI, chain, expiry and browser-bound nonce',async()=>{
 assert.throws(()=>authConfig('https://w3rk.net',undefined,'8453'))
 for(const change of [{domain:'evil.example'},{uri:'https://evil.example'},{chainId:137},{expirationTime:undefined},{issuedAt:new Date(Date.now()-600001).toISOString(),expirationTime:new Date(Date.now()-300001).toISOString()}])assert.equal(await verifyAndConsume(db,await challenge(change),config),null)
 const valid=await challenge()
 assert.equal(await verifyAndConsume(db,{...valid,cookie:''},config),null)
 assert.equal(await verifyAndConsume(db,{...valid,signature:await bob.signMessage('wrong')},config),null)
 assert.equal((await verifyAndConsume(db,valid,config))?.id,alice.address)
 assert.equal(await verifyAndConsume(db,valid,config),null)
})
test('concurrent SIWE replay consumes exactly one challenge',async()=>{
 const input=await challenge()
 const results=await Promise.all([verifyAndConsume(db,input,config),verifyAndConsume(db,input,config)])
 assert.equal(results.filter(Boolean).length,1)
})

test('contract-wallet SIWE preserves browser binding, domain, chain and single-use nonce',async()=>{
 const address='0x0000000000000000000000000000000000000127' as Address
 const mock=contractWallet(address,alice.address as Address)
 const input=await challenge({address})
 const verify=(value:typeof input)=>verifyAndConsume(db,value,config,Date.now(),mock.clientFor)
 assert.equal(await verify({...input,cookie:''}),null)
 assert.equal(mock.calls.length,0)
 assert.equal(await verify({...input,signature:await bob.signMessage('wrong')}),null)
 assert.equal((await db.prepare('SELECT consumedAt FROM auth_challenges WHERE nonce=?').bind(input.nonce).first<{consumedAt:number|null}>())?.consumedAt,null)
 const results=await Promise.all([verify(input),verify(input)])
 assert.equal(results.filter(Boolean).length,1)
 assert.deepEqual(results.find(Boolean),{id:address,chainId:8453,walletType:'SCW'})
 const before=mock.calls.length
 assert.equal(await verify(await challenge({address,domain:'wrong.example'})),null)
 assert.equal(await verify(await challenge({address,chainId:137})),null)
 assert.equal(await verify(await challenge({address,expirationTime:new Date(Date.now()-1).toISOString()})),null)
 assert.equal(mock.calls.length,before)
})

test('a challenge expiring during contract verification is neither accepted nor consumed',async()=>{
 const address='0x0000000000000000000000000000000000000127' as Address
 const mock=contractWallet(address,alice.address as Address),input=await challenge({address}),now=Date.now()
 assert.equal(await verifyAndConsume(db,input,config,now,mock.clientFor,()=>now+300001),null)
 assert.equal((await db.prepare('SELECT consumedAt FROM auth_challenges WHERE nonce=?').bind(input.nonce).first<{consumedAt:number|null}>())?.consumedAt,null)
})
