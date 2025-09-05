import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SiweMessage } from 'siwe'
import { randomBytes } from 'crypto'

const secret = process.env.NEXTAUTH_SECRET ?? randomBytes(32).toString('hex')

export const authOptions: AuthOptions = {
  secret,
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
          
          // Validate that we're using allowed chain IDs
          // Base Mainnet: 8453, Base Sepolia: 84532, Ethereum: 1
          const allowedChainIds = [8453, 84532, 1]
          if (!allowedChainIds.includes(siwe.chainId)) {
            console.log(`Invalid chain ID: ${siwe.chainId}`)
            return null
          }
          
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
            return { id: siwe.address, chainId: siwe.chainId }
          }
          return null
        } catch (error) {
          console.error('SIWE verification failed:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id
        token.chainId = (user as any).chainId
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).address = token.sub
      ;(session as any).chainId = token.chainId
      return session
    },
  },
}

