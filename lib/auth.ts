import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SiweMessage } from 'siwe'
import { cookies } from 'next/headers'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || '{}'))
          const nonce = cookies().get('nonce')?.value
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

