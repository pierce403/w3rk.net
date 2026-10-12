import 'next-auth'
declare module 'next-auth' {
  interface Session { address?:string;chainId?:number;walletType?:'EOA'|'SCW' }
  interface User {chainId?:number;walletType?:'EOA'|'SCW'}
}
