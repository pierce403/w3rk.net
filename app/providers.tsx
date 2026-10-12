'use client'
import { PrivyProvider } from '@privy-io/react-auth'
import { base, baseSepolia, mainnet } from 'viem/chains'
import { SessionProvider } from 'next-auth/react'
import AuthProvider from '../components/AuthProvider'
import ServiceWorker from '../components/ServiceWorker'
import { privyAppId } from '../lib/privy'
export default function Providers({children}:{children:React.ReactNode}) {
  return <SessionProvider><PrivyProvider appId={privyAppId} config={{
    appearance: { theme: 'light', accentColor: '#0052ff', logo: 'https://w3rk.net/icon.svg', walletList: ['coinbase_wallet'] },
    loginMethods: ['wallet', 'farcaster'],
    embeddedWallets: { ethereum: { createOnLogin: 'all-users' } },
    // Privy 3.48.1 filters its renamed coinbase_smart_wallet connector out of
    // walletList when smartWalletOnly is forced. The supported chooser keeps
    // smart wallets and EOAs available; server verification determines the type.
    externalWallets: { coinbaseWallet: { config: { preference: { options: 'all' } } } },
    defaultChain: base,
    supportedChains: [base, baseSepolia, mainnet],
  }}><AuthProvider>{children}</AuthProvider></PrivyProvider><ServiceWorker /></SessionProvider>
}
