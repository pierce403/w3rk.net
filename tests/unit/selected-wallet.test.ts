import test from 'node:test'
import assert from 'node:assert/strict'
import {Wallet,getBytes,verifyMessage} from 'ethers'
import {bytesToHex,hexToBytes,serializeErc6492Signature,type Hex} from 'viem'
import {assertWalletState,createSelectedWalletAccount,createWalletSessionController,parseWalletChainId} from '../../lib/selected-wallet'
import {createXMTPSigner} from '../../lib/xmtp-signer'

const alice=Wallet.createRandom(),bob=Wallet.createRandom()
function deferred<T>(){
 let resolve!:(value:T|PromiseLike<T>)=>void,reject!:(reason?:unknown)=>void
 const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no})
 return{promise,resolve,reject}
}
function walletProvider(){
 const calls:{method:string;params?:unknown}[]=[]
 const state={accounts:[alice.address],chain:'0x2105',sign:async(params:unknown)=>{
  const [encoded,address]=params as [Hex,string]
  assert.equal(address.toLowerCase(),alice.address.toLowerCase())
  return await alice.signMessage(getBytes(encoded)) as Hex
 }}
 const provider={async request(input:{method:string;params?:unknown}):Promise<unknown>{
  calls.push(input)
  if(input.method==='eth_accounts')return state.accounts
  if(input.method==='eth_chainId')return state.chain
  if(input.method==='personal_sign')return state.sign(input.params)
  throw new Error('Unexpected provider operation')
 }}
 return{provider,state,calls,wallet:{address:alice.address,getEthereumProvider:async()=>provider}}
}

test('wallet chain parsing accepts EVM identifiers and refuses ambiguous or unsafe input',()=>{
 for(const input of [8453,'8453','0x2105','eip155:8453'])assert.equal(parseWalletChainId(input),8453)
 for(const input of [0,-1,1.5,NaN,Infinity,null,undefined,{},'','eip155:8453:1','eip155:0x2105','solana:8453','8453abc','1e3','0x','-1','1.5',Number.MAX_SAFE_INTEGER+1,'9007199254740992']){
  assert.throws(()=>parseWalletChainId(input),`must reject ${String(input)}`)
 }
})

test('selected wallet state uses fresh provider account and chain values',async()=>{
 const mock=walletProvider()
 mock.state.accounts=[bob.address,alice.address]
 assert.equal(await assertWalletState(mock.provider,alice.address,8453,()=>true),8453)
 assert.deepEqual(new Set(mock.calls.map(call=>call.method)),new Set(['eth_accounts','eth_chainId']))
 mock.state.accounts=[bob.address]
 await assert.rejects(assertWalletState(mock.provider,alice.address,8453,()=>true))
 mock.state.accounts=[alice.address];mock.state.chain='0x1'
 await assert.rejects(assertWalletState(mock.provider,alice.address,8453,()=>true))
 mock.state.chain='0x2105'
 await assert.rejects(assertWalletState(mock.provider,alice.address,8453,()=>false))
})

test('SIWE and XMTP sign exact UTF-8 messages for the selected address without transactions',async()=>{
 const mock=walletProvider(),account=createSelectedWalletAccount(mock.wallet,8453,()=>true)
 const message='w3rk.net wants you to sign in with your Ethereum account:\nA precise message ✓'
 const signature=await account.signMessage({message,chainId:8453})
 assert.equal(verifyMessage(message,signature),alice.address)
 assert.deepEqual(mock.calls.find(call=>call.method==='personal_sign')?.params,[bytesToHex(new TextEncoder().encode(message)),alice.address])
 const signer=createXMTPSigner(account,{address:alice.address,chainId:8453,walletType:'EOA'},8453,()=>true)
 assert.equal(verifyMessage('XMTP identity proof',bytesToHex(await signer.signMessage('XMTP identity proof'))),alice.address)
 assert.ok(mock.calls.every(call=>['eth_accounts','eth_chainId','personal_sign'].includes(call.method)))
})

test('wrong requested chain and stale provider acquisition never prompt the wallet',async()=>{
 const mock=walletProvider()
 await assert.rejects(createSelectedWalletAccount(mock.wallet,8453,()=>true).signMessage({message:'test',chainId:1}))
 assert.equal(mock.calls.filter(call=>call.method==='personal_sign').length,0)
 let current=true
 const pending=deferred<typeof mock.provider>()
 const account=createSelectedWalletAccount({address:alice.address,getEthereumProvider:()=>pending.promise},8453,()=>current)
 const signed=account.signMessage({message:'test',chainId:8453})
 current=false;pending.resolve(mock.provider)
 await assert.rejects(signed)
 assert.equal(mock.calls.filter(call=>call.method==='personal_sign').length,0)
})

test('account, chain, and generation changes during the wallet prompt reject its result',async()=>{
 for(const change of ['account','chain','generation']){
  const mock=walletProvider();let current=true
  mock.state.sign=async()=>{
   if(change==='account')mock.state.accounts=[bob.address]
   if(change==='chain')mock.state.chain='0x1'
   if(change==='generation')current=false
   return await alice.signMessage('test') as Hex
  }
  const account=createSelectedWalletAccount(mock.wallet,8453,()=>current)
  await assert.rejects(account.signMessage({message:'test',chainId:8453}),change)
  assert.equal(mock.calls.filter(call=>call.method==='personal_sign').length,1)
 }
})

test('provider replacement during signing is re-read instead of trusting the old provider',async()=>{
 const old=walletProvider(),replacement=walletProvider()
 replacement.state.chain='0x1'
 let provider=old.provider,reads=0
 old.state.sign=async()=>{provider=replacement.provider;return await alice.signMessage('test') as Hex}
 const account=createSelectedWalletAccount({address:alice.address,getEthereumProvider:async()=>{reads++;return provider}},8453,()=>true)
 await assert.rejects(account.signMessage({message:'test',chainId:8453}))
 assert.equal(reads,2)
 assert.equal(old.state.chain,'0x2105','old provider remains stale while the replacement has the new chain')
 assert.deepEqual(replacement.calls.map(call=>call.method),['eth_accounts','eth_chainId'])
})

test('counterfactual smart-wallet signature bytes reach XMTP unchanged',async()=>{
 const mock=walletProvider(),contract='0x0000000000000000000000000000000000000127'
 const wrapped=serializeErc6492Signature({address:'0x0000000000000000000000000000000000000649',data:'0x1234',signature:await alice.signMessage('XMTP') as Hex})
 mock.state.accounts=[contract]
 mock.state.sign=async(params)=>{assert.equal((params as [Hex,string])[1],contract);return wrapped}
 const account=createSelectedWalletAccount({...mock.wallet,address:contract},8453,()=>true)
 const signer=createXMTPSigner(account,{address:contract,chainId:8453,walletType:'SCW'},8453,()=>true)
 assert.equal(signer.type,'SCW')
 assert.deepEqual(await signer.signMessage('XMTP'),hexToBytes(wrapped))
})

test('logout invalidates pending login immediately, then clears the cookie after its response',async()=>{
 const controller=createWalletSessionController(),response=deferred<void>(),started=deferred<void>()
 const events:string[]=[];let current!:()=>boolean
 const login=controller.runSignIn(async(isCurrent,submit)=>{current=isCurrent;await submit(async()=>{events.push('login-start');started.resolve();await response.promise;events.push('login-response')})})
 await started.promise
 assert.equal(current(),true)
 const logout=controller.signOut(async()=>{events.push('logout-cookie-clear')})
 assert.equal(current(),false)
 assert.equal(controller.isBusy,true)
 await assert.rejects(controller.runSignIn(async()=>{events.push('unexpected-new-login')}))
 assert.deepEqual(events,['login-start'])
 response.resolve();await login.catch(()=>{});await logout
 assert.deepEqual(events,['login-start','login-response','logout-cookie-clear'])
 assert.equal(controller.isBusy,false)
 await controller.runSignIn(async isCurrent=>{assert.equal(isCurrent(),true);events.push('new-login')})
 assert.equal(events.at(-1),'new-login')
})

test('failed login does not skip logout cleanup and invalidation prevents late identity reuse',async()=>{
 const controller=createWalletSessionController(),response=deferred<void>(),started=deferred<void>()
 let current!:()=>boolean,cleared=0
 const login=controller.runSignIn(async(isCurrent,submit)=>{current=isCurrent;await submit(async()=>{started.resolve();await response.promise})})
 const rejected=assert.rejects(login)
 await started.promise
 controller.invalidate();assert.equal(current(),false)
 const logout=controller.signOut(async()=>{cleared++})
 response.reject(new Error('Provider cancelled'))
 await rejected;await logout
 assert.equal(cleared,1);assert.equal(controller.isBusy,false)
})

test('explicit provider logout remains queued behind automatic cookie cleanup, including failure',async()=>{
 const controller=createWalletSessionController(),first=deferred<void>(),started=deferred<void>(),events:string[]=[]
 const automatic=controller.signOut(async()=>{events.push('automatic-start');started.resolve();await first.promise})
 const failed=assert.rejects(automatic)
 await started.promise
 const explicit=controller.signOut(async()=>{events.push('cookie-and-provider-logout')})
 await assert.rejects(controller.runSignIn(async()=>{events.push('unexpected-login')}))
 assert.deepEqual(events,['automatic-start'])
 first.reject(new Error('Transient cleanup failure'))
 await failed;await explicit
 assert.deepEqual(events,['automatic-start','cookie-and-provider-logout'])
 assert.equal(controller.isBusy,false)
})

test('logout does not wait for an unanswered wallet prompt and its late result cannot submit credentials',async()=>{
 const controller=createWalletSessionController(),prompt=deferred<void>(),started=deferred<void>()
 let current!:()=>boolean,submitted=0,cleared=0
 const login=controller.runSignIn(async(isCurrent,submit)=>{
  current=isCurrent;started.resolve();await prompt.promise
  await submit(async()=>{submitted++})
 })
 const rejected=assert.rejects(login)
 await started.promise
 await controller.signOut(async()=>{cleared++})
 assert.equal(cleared,1);assert.equal(current(),false);assert.equal(submitted,0)
 await assert.rejects(controller.runSignIn(async()=>{}),'an older pending prompt cannot overlap a new login')
 prompt.resolve();await rejected
 assert.equal(submitted,0);assert.equal(controller.isBusy,false)
 await controller.runSignIn(async(isCurrent,submit)=>{
  assert.equal(isCurrent(),true);await submit(async()=>{submitted++})
 })
 assert.equal(submitted,1)
})

test('malformed provider signature responses cannot become XMTP signature bytes',async()=>{
 for(const malformed of [null,{},'not-hex','0x','0x123']){
  const mock=walletProvider()
  const provider={request:async(input:{method:string;params?:unknown})=>input.method==='personal_sign'?malformed:mock.provider.request(input)}
  const account=createSelectedWalletAccount({address:alice.address,getEthereumProvider:async()=>provider},8453,()=>true)
  await assert.rejects(account.signMessage({message:'test'}))
 }
})
