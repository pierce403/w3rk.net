'use client'

import { ThirdwebProvider } from "thirdweb/react";
import { SessionProvider } from 'next-auth/react'
import AuthProvider from '../components/AuthProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThirdwebProvider clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} activeChain="base">
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThirdwebProvider>
    </SessionProvider>
  )
}
