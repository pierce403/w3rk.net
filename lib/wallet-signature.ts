import {createPublicClient,http,isErc6492Signature,recoverMessageAddress,hashMessage,type Address,type Hex,type PublicClient} from 'viem'
import {base,baseSepolia,mainnet} from 'viem/chains'

export type WalletType='EOA'|'SCW'
export const erc1271Abi=[{type:'function',name:'isValidSignature',stateMutability:'view',inputs:[{name:'hash',type:'bytes32'},{name:'signature',type:'bytes'}],outputs:[{name:'magicValue',type:'bytes4'}]}] as const
// These are app-supported public chains, never an RPC URL supplied by a login request.
const chains=[base,baseSepolia,mainnet]
export type SignatureClient=Pick<PublicClient,'getBlockNumber'|'readContract'|'verifyMessage'>
export function signatureClient(chainId:number):SignatureClient|null {
  const chain=chains.find(value=>value.id===chainId)
  return chain?createPublicClient({chain,transport:http(undefined,{retryCount:0,timeout:8000})}):null
}
export type SignatureClientFactory=(chainId:number)=>SignatureClient|null
export async function verifyWalletSignature(address:Address,chainId:number,message:string,signature:string,clientFor:SignatureClientFactory=signatureClient):Promise<WalletType|null> {
  try {
    if(!/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)||signature.length>4096)return null
    const hex=signature as Hex
    const wrapped=isErc6492Signature(hex)
    // Standard EOA signatures need no RPC, including EIP-7702 accounts signing as EOAs.
    // Wrapped counterfactual signatures must be validated as contracts first.
    if(!wrapped){
      try {if((await recoverMessageAddress({message,signature:hex})).toLowerCase()===address.toLowerCase())return 'EOA'}catch{}
    }
    const client=clientFor(chainId)
    if(!client)return null
    const blockNumber=await client.getBlockNumber()
    if(wrapped){
      // Viem performs ERC-6492 validation via eth_call; no transaction/deployment is submitted.
      return await client.verifyMessage({address,message,signature:hex,blockNumber})?'SCW':null
    }
    const magic=await client.readContract({address,abi:erc1271Abi,functionName:'isValidSignature',args:[hashMessage(message),hex],blockNumber})
    return magic==='0x1626ba7e'?'SCW':null
  }catch{return null} // Do not log RPC errors: they can contain the signed message/signature.
}
