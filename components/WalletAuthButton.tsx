'use client'
import { useSession } from 'next-auth/react'
import { useSelectedWallet } from './AuthProvider'
import { useENSName } from '../hooks/useENSName'

export default function WalletAuthButton() {
  const wallet = useSelectedWallet()
  const { data: session } = useSession()
  const { displayName } = useENSName(session?.address)
  return <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
    <button className="btn small" disabled={!wallet.ready || wallet.busy} onClick={wallet.connect}>
      {!wallet.ready ? 'Loading wallet...' : wallet.authenticated ? 'Connect another wallet' : 'Connect wallet'}
    </button>
    {wallet.ready && wallet.authenticated && <>
      <label className="small">Wallet{' '}
        <select aria-label="Wallet for W3RK" value={wallet.selectedKey} onChange={event => wallet.select(event.target.value)}>
          <option value="">Choose a wallet</option>
          {wallet.wallets.map(item => <option key={item.key} value={item.key}>{item.label} · {item.address.slice(0, 6)}…{item.address.slice(-4)}</option>)}
        </select>
      </label>
      {wallet.account && <label className="small">Network{' '}
        <select aria-label="Wallet network" value={wallet.chainId} disabled={wallet.busy} onChange={event => void wallet.switchChain(Number(event.target.value))}>
          {![8453, 84532, 1].includes(wallet.chainId ?? 0) && <option value={wallet.chainId}>Unsupported network</option>}
          <option value={8453}>Base</option><option value={84532}>Base Sepolia</option><option value={1}>Ethereum</option>
        </select>
      </label>}
    </>}
    {session?.address
      ? <a href={`/u/${session.address}`}>{displayName || `${session.address.slice(0, 6)}...${session.address.slice(-4)}`}</a>
      : wallet.account && <button className="btn small" disabled={wallet.busy} onClick={() => void wallet.login()}>{wallet.busy ? 'Signing in...' : 'Sign in'}</button>}
    {(session?.address || wallet.authenticated) && <button className="btn small" onClick={() => void wallet.logout()}>Sign out</button>}
    {wallet.error && <span role="alert">{wallet.error}</span>}
  </div>
}
