import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SiweMessage } from 'siwe'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || '{}'))
          const cookieHeader =
            (req as any)?.headers?.get?.('cookie') || (req as any)?.headers?.cookie || ''
          const nonce = cookieHeader
            .split(';')
            .map((c: string) => c.trim())
            .find((c: string) => c.startsWith('nonce='))
            ?.split('=')[1]
          const result = await siwe.verify({
            signature: credentials?.signature || '',
            nonce,
          })
          if (result.success) {
            return { id: siwe.address }
          }
          return null
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = (user as any).id
      return token
    },
    async session({ session, token }) {
      ;(session as any).address = token.sub
      return session
    },
  },
}

