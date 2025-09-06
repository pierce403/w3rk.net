'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { SessionProvider } from 'next-auth/react'
import AuthProvider from '../components/AuthProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        // Customize Privy's appearance and behavior
        appearance: {
          theme: 'light',
          accentColor: '#0052ff', // Base blue color
          logo: 'https://w3rk.net/icon.svg',
          walletList: ['coinbase_wallet'], // Prioritize Coinbase - Farcaster is social login
        },
        // Supported login methods - Wallet and Farcaster
        loginMethods: ['wallet', 'farcaster'],
        // Smart Wallet Configuration - Coinbase Smart Wallet First
        embeddedWallets: {
          createOnLogin: 'all-users',
          requireUserPasswordOnCreate: false,
        },
        // External wallet configurations
        externalWallets: {
          coinbaseWallet: {
            connectionOptions: 'smartWalletOnly',
          },
        },
        // Default wallet chain for smart wallet creation
        defaultChain: {
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
        // Supported chains - Base first
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
        ]
      }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </PrivyProvider>
    </SessionProvider>
  )
}
