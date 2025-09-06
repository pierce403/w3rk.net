'use client'

import { ConnectButton, useAddress, useDisconnect } from "thirdweb/react";
import { useENSName } from '../hooks/useENSName'

export default function ThirdwebAuthButton() {
  const address = useAddress()
  const disconnect = useDisconnect()
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
        <button className="btn small" onClick={() => disconnect()}>Sign out</button>
      </div>
    )
  }

  return <ConnectButton />
}
