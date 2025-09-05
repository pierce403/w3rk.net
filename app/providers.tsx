'use client'

import { SessionProvider } from 'next-auth/react'
import '../lib/walletconnect' // Initialize WalletConnect

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
