'use client'

import { ConnectButton, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { thirdwebClient } from '../lib/thirdwebClient'
import { useENSName } from '../hooks/useENSName'

export default function BaseAuthButton() {
  const account = useActiveAccount()
  const address = account?.address
  const { disconnect } = useDisconnect()
  const wallet = useActiveWallet()
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
          onClick={() => wallet && disconnect(wallet)}
          style={{ fontSize: '0.8rem' }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return <ConnectButton client={thirdwebClient} theme="light" />
}
