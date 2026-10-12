import 'next-auth'
declare module 'next-auth' {
  interface Session { address?:string;chainId?:number }
  interface User {chainId?:number}
}
