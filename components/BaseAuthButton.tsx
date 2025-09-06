'use client'

import { ConnectButton, useAddress, useDisconnect } from "thirdweb/react";
import { useENSName } from '../hooks/useENSName'

export default function BaseAuthButton() {
  const address = useAddress()
  const disconnect = useDisconnect()
  const { displayName } = useENSName(address)

  if (address) {
    const userDisplayName = displayName || `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }} />
          <a
            href={`/u/${address}`}
            style={{
              fontSize: '0.875rem',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: '500'
            }}
          >
            {userDisplayName}
          </a>
        </div>
        <button
          className="btn small secondary"
          onClick={() => disconnect()}
          style={{ fontSize: '0.8rem' }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return <ConnectButton theme="light" />
}
