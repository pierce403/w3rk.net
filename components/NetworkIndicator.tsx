'use client'

import { useSession } from 'next-auth/react'

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  84532: 'Base Sepolia'
}

export default function NetworkIndicator() {
  const { data: session } = useSession()
  
  if (!session?.chainId) {
    return null
  }
  
  const chainName = CHAIN_NAMES[session.chainId] || `Chain ${session.chainId}`
  
  return (
    <div className="network-indicator">
      <span className="network-dot"></span>
      <span className="network-name">{chainName}</span>
      <style jsx>{`
        .network-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }
        .network-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${session.chainId === 8453 ? '#0052FF' : session.chainId === 84532 ? '#FFA500' : '#627EEA'};
        }
        .network-name {
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
