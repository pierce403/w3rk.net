'use client'

import { ConnectButton, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { thirdwebClient } from '../lib/thirdwebClient'
import { useENSName } from '../hooks/useENSName'

export default function ThirdwebAuthButton() {
  const account = useActiveAccount()
  const address = account?.address
  const { disconnect } = useDisconnect()
  const wallet = useActiveWallet()
  const { displayName } = useENSName(address)

  if (address) {
    const userDisplayName = displayName || `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a
          href={`/u/${address}`}
          style={{ fontSize: '0.875rem', textDecoration: 'none', color: '#666' }}
        >
          {userDisplayName}
        </a>
        <button className="btn small" onClick={() => wallet && disconnect(wallet)}>Sign out</button>
      </div>
    )
  }

  return <ConnectButton client={thirdwebClient} />
}
