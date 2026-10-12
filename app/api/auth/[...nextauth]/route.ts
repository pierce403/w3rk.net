import NextAuthModule from 'next-auth'
import { cjsDefault } from '../../../../lib/cjs-default'
const NextAuth=cjsDefault(NextAuthModule)
import { getAuthOptions } from '../../../../lib/auth'
import { handle } from '../../../../lib/http'
import type { NextRequest } from 'next/server'
type Context={params:Promise<{nextauth:string[]}>}
async function handler(req:NextRequest,context:Context) {
  return handle(async()=> {
    const result=await NextAuth(getAuthOptions())(req,{params:await context.params})
    result.headers.set('Cache-Control','private, no-store')
    return result
  })
}
export { handler as GET, handler as POST }
