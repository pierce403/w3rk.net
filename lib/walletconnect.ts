'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { base, baseSepolia, mainnet } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '83c5a5f5e1b745cde3ae5be39b6b6f4e'

// 2. Set up the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 3. Configure the metadata
const metadata = {
  name: 'w3rk.net',
  description: 'Decentralized tasking with UBI',
  url: 'https://w3rk.net', // origin must match your domain & subdomain
  icons: ['https://w3rk.net/icon.svg']
}

// 4. Create the modal
const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [base, baseSepolia, mainnet],
  defaultNetwork: base,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export default modal
