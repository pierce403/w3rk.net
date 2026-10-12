import {createPublicClient,custom,decodeFunctionData,encodeFunctionResult,recoverAddress,type Address,type Hex} from 'viem'
import {base} from 'viem/chains'
import {erc1271Abi} from '../../lib/wallet-signature'
// Controlled JSON-RPC fixture implementing the owner-signature contract from ERC-1271.
// This runs the real viem ABI/hash/recovery pipeline, without any external RPC or wallet.
export function contractWallet(contract:Address,owner:Address){
 const calls:{method:string;params:unknown}[]=[]
 const client=createPublicClient({chain:base,transport:custom({async request({method,params}){
  calls.push({method,params})
  if(method==='eth_blockNumber')return '0xabc'
  if(method!=='eth_call')throw new Error('Unexpected RPC method')
  const [call,block]=params as [{to:Address;data:Hex},string]
  if(call.to.toLowerCase()!==contract.toLowerCase()||block!=='0xabc')throw new Error('Wrong contract or verification block')
  const decoded=decodeFunctionData({abi:erc1271Abi,data:call.data})
  const [hash,signature]=decoded.args
  let valid=false
  try{valid=(await recoverAddress({hash,signature})).toLowerCase()===owner.toLowerCase()}catch{}
  return encodeFunctionResult({abi:erc1271Abi,functionName:'isValidSignature',result:valid?'0x1626ba7e':'0xffffffff'})
 }},{retryCount:0})})
 return{client,calls,clientFor:(chainId:number)=>chainId===8453?client:null}
}
