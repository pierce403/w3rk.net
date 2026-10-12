import type { AuthOptions } from 'next-auth'
import CredentialsModule from 'next-auth/providers/credentials'
import { cjsDefault } from './cjs-default'
const CredentialsProvider=cjsDefault(CredentialsModule)
import { env } from 'cloudflare:workers'
import { authConfig, verifyAndConsume } from './siwe'
export function getAuthOptions(): AuthOptions {
  const config=authConfig(env.NEXTAUTH_URL,env.NEXTAUTH_SECRET,env.AUTH_ALLOWED_CHAIN_IDS)
  return {
    secret:config.secret,
    providers:[CredentialsProvider({name:'Ethereum',credentials:{message:{label:'Message',type:'text'},signature:{label:'Signature',type:'text'}},
      async authorize(credentials,req) {
        if(String(env.READ_ONLY)!=='false'||!credentials) return null
        return verifyAndConsume(env.DB,{message:credentials.message,signature:credentials.signature,cookie:String(req.headers?.cookie??'')},config)
      },
    })],
    session:{strategy:'jwt',maxAge:24*60*60},
    callbacks:{
      async jwt({token,user}) {if(user){token.sub=user.id;token.chainId=user.chainId}return token},
      async session({session,token}) {session.address=token.sub;session.chainId=typeof token.chainId==='number'?token.chainId:undefined;return session},
    },
    logger:{error(){console.error('auth_error')},warn(code){console.warn('auth_warning',code)},debug(){}},
  }
}
