'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00lu11pf5a987lac'}
      config={{
        // Customize Privy's appearance and behavior
        appearance: {
          theme: 'light',
          accentColor: '#0052ff', // Base blue color
          logo: 'https://w3rk.net/icon.svg',
        },
        // Supported login methods
        loginMethods: ['wallet'],
        // Supported wallets  
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base-mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://mainnet.base.org'] },
              public: { http: ['https://mainnet.base.org'] },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://basescan.org' },
            },
          },
          {
            id: 84532,
            name: 'Base Sepolia',
            network: 'base-sepolia',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://sepolia.base.org'] },
              public: { http: ['https://sepolia.base.org'] },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
            },
          },
          {
            id: 1,
            name: 'Ethereum',
            network: 'mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://ethereum.publicnode.com'] },
              public: { http: ['https://ethereum.publicnode.com'] },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://etherscan.io' },
            },
          }
        ],
        // Show wallet connection options including QR codes
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        }
      }}
      >
        {children}
      </PrivyProvider>
    </SessionProvider>
  )
}
