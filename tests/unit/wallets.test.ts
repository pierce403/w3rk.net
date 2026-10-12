import test from 'node:test'
import assert from 'node:assert/strict'
import {Wallet} from 'ethers'
import {hexToBytes,createPublicClient,custom,encodeAbiParameters,hashMessage,serializeErc6492Signature,type Address,type Hex} from 'viem'
import {base} from 'viem/chains'
import {verifyWalletSignature,type SignatureClient} from '../../lib/wallet-signature'
import {createXMTPSigner,xmtpSignerKey} from '../../lib/xmtp-signer'
import {contractWallet} from '../helpers/contract-wallet'
const owner=Wallet.createRandom(),other=Wallet.createRandom()
const address='0x0000000000000000000000000000000000000127' as Address
const message='Controlled smart-wallet authentication test'
test('EOA recovery stays offline and contract validation uses the declared chain and one fixed block',async()=>{
 const signature=await owner.signMessage(message)
 assert.equal(await verifyWalletSignature(owner.address as Address,8453,message,signature,()=>{throw new Error('EOA must not use RPC')}),'EOA')
 const mock=contractWallet(address,owner.address as Address)
 assert.equal(await verifyWalletSignature(address,8453,message,signature,mock.clientFor),'SCW')
 assert.deepEqual(mock.calls.map(c=>c.method),['eth_blockNumber','eth_call'])
 assert.equal(await verifyWalletSignature(address,1,message,signature,mock.clientFor),null)
 assert.equal(await verifyWalletSignature(address,8453,message,await other.signMessage(message),mock.clientFor),null)
 assert.equal(await verifyWalletSignature(address,8453,message+'changed',signature,mock.clientFor),null)
})
test('malformed signatures and RPC errors fail closed without logging signature-bearing errors',async()=>{
 const oldError=console.error;let logged=false
 console.error=()=>{logged=true}
 try{
  assert.equal(await verifyWalletSignature(address,8453,message,'not hex',()=>{throw Error('should not call')}),null)
  assert.equal(await verifyWalletSignature(address,8453,message,'0x00',()=>({getBlockNumber:async()=>{throw Error('sensitive RPC input')}} as unknown as SignatureClient)),null)
  assert.equal(logged,false)
 }finally{console.error=oldError}
})
test('XMTP signer uses verified type/chain, bytes, and latest block semantics',async()=>{
 const requests:{message:string;chainId?:number}[]=[]
 const account={address,signMessage:async(input:{message:string;chainId?:number})=>{requests.push(input);return await owner.signMessage(input.message) as Hex}}
 const scw=createXMTPSigner(account,{address,chainId:8453,walletType:'SCW'},8453,()=>true)
 assert.equal(scw.type,'SCW')
 if(scw.type!=='SCW')throw Error('Expected contract signer')
 assert.equal(scw.getChainId(),8453n);assert.equal(scw.getBlockNumber,undefined)
 assert.deepEqual(await scw.signMessage(message),hexToBytes(await owner.signMessage(message) as Hex))
 assert.deepEqual(requests,[{message,chainId:8453}])
 const eoa=createXMTPSigner(account,{address,chainId:84532,walletType:'EOA'},84532,()=>true)
 assert.equal(eoa.type,'EOA')
 assert.notEqual(await xmtpSignerKey(scw),await xmtpSignerKey(eoa))
 const mainnet=createXMTPSigner(account,{address,chainId:1,walletType:'SCW'},1,()=>true)
 assert.notEqual(await xmtpSignerKey(scw),await xmtpSignerKey(mainnet))
 assert.throws(()=>createXMTPSigner(account,{address,chainId:8453,walletType:'SCW'},1,()=>true),/sign-in network/)
 assert.throws(()=>createXMTPSigner(account,{address,chainId:84532,walletType:'SCW'},84532,()=>true),/unavailable/)
 assert.throws(()=>createXMTPSigner(account,{address,chainId:8453},8453,()=>true),/Sign in again/)
})
test('XMTP signing refuses a changed wallet/session before and after the wallet prompt',async()=>{
 let current=false,calls=0
 const account={address,signMessage:async()=>{calls++;current=false;return '0x00' as Hex}}
 const signer=createXMTPSigner(account,{address,chainId:8453,walletType:'SCW'},8453,()=>current)
 await assert.rejects(async()=>signer.signMessage(message),/changed/);assert.equal(calls,0)
 current=true
 await assert.rejects(async()=>signer.signMessage(message),/changed/);assert.equal(calls,1)
})

test('counterfactual signatures reach the universal verifier intact at one block and reject false/revert',async()=>{
 const wrapped=serializeErc6492Signature({address:'0x0000000000000000000000000000000000000649',data:'0x1234',signature:await owner.signMessage(message) as Hex})
 const encoded=encodeAbiParameters([{type:'address'},{type:'bytes32'},{type:'bytes'}],[address,hashMessage(message),wrapped])
 for(const outcome of ['valid','false','revert']){
  const methods:string[]=[]
  const client=createPublicClient({chain:base,transport:custom({async request({method,params}){
   methods.push(method)
   if(method==='eth_blockNumber')return '0xabc'
   assert.equal(method,'eth_call')
   const [call,block]=params as [{to?:Address;data:Hex},string]
   assert.equal(block,'0xabc');assert.equal(call.to,undefined,'uses deployless read-only validator')
   assert.ok(call.data.endsWith(encoded.slice(2)),'address, prefixed message hash and wrapped signature pass unchanged')
   if(outcome==='revert')throw Object.assign(new Error('execution reverted'),{code:3})
   return outcome==='valid'?'0x01':'0x00'
  }},{retryCount:0})})
  assert.equal(await verifyWalletSignature(address,8453,message,wrapped,()=>client),outcome==='valid'?'SCW':null)
  assert.deepEqual(methods,['eth_blockNumber','eth_call'])
 }
})
