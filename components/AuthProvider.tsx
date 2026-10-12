'use client'
import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth'
import { useSession, signIn, signOut } from 'next-auth/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SiweMessage } from 'siwe'
import { assertWalletState, createSelectedWalletAccount, createWalletSessionController, parseWalletChainId, type WalletProvider } from '../lib/selected-wallet'
import { disconnectXMTP } from '../lib/xmtp'

const supportedChains = [8453, 84532, 1]
// One browser-wide queue protects callbacks across provider remounts. It holds
// no account, signature, nonce, or session data.
const sessionOperations = createWalletSessionController()
function walletKey(wallet: ConnectedWallet) {
  return `${wallet.connectorType}:${wallet.walletClientType}:${wallet.address.toLowerCase()}:${wallet.connectedAt}`
}
type WalletContext = {
  ready: boolean
  authenticated: boolean
  wallets: { key: string; address: string; label: string }[]
  selectedKey: string
  account: ReturnType<typeof createSelectedWalletAccount> | null
  chainId?: number
  revision: number
  busy: boolean
  error: string
  connect: () => void
  select: (key: string) => void
  switchChain: (chainId: number) => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
  isCurrent: () => boolean
}
const SelectedWalletContext = createContext<WalletContext | null>(null)
export function useSelectedWallet() {
  const value = useContext(SelectedWalletContext)
  if (!value) throw new Error('The wallet provider is unavailable.')
  return value
}

export default function AuthProvider({children}:{children:React.ReactNode}) {
  const privy = usePrivy()
  const { wallets, ready: walletsReady } = useWallets()
  const { data: session, status } = useSession()
  const ready = privy.ready && walletsReady && status !== 'loading'
  const [selectedKey, setSelectedKey] = useState('')
  const [revision, setRevision] = useState(0)
  const [walletState, setWalletState] = useState<{ key: string; revision: number; chainId: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [switching, setSwitching] = useState(false)
  const switchingRef = useRef(false)
  const [error, setError] = useState('')
  const mounted = useRef(false)
  const epoch = useRef(0)
  const matches = wallets.filter(wallet => walletKey(wallet) === selectedKey)
  const selectedWallet = matches.length === 1 ? matches[0] : null
  const selectedAddress = selectedWallet?.address
  const selectedChain = selectedWallet?.chainId
  const current = useRef({ ready, authenticated: privy.authenticated, selectedKey, selectedWallet })
  current.current = { ready, authenticated: privy.authenticated, selectedKey, selectedWallet }
  const privyLogout = useRef(privy.logout)
  privyLogout.current = privy.logout
  const observedIdentity = useRef('')
  const previousSelection = useRef<{ key: string; chain: string } | null>(null)

  const clearSession = useCallback(async (clearPrivy = false) => {
    setBusy(true)
    try {
      await sessionOperations.signOut(async () => {
        // Clear both sessions even if one provider reports an error.
        try { await signOut({ redirect: false }) }
        finally { if (clearPrivy) await privyLogout.current() }
      })
    } catch { if (mounted.current) setError('Could not finish signing out. Please try again.') }
    finally { if (mounted.current) setBusy(sessionOperations.isBusy) }
  }, [])

  const invalidate = useCallback(() => {
    epoch.current += 1
    sessionOperations.invalidate()
    disconnectXMTP()
    setWalletState(null)
    setRevision(epoch.current)
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      epoch.current += 1
      sessionOperations.invalidate()
      disconnectXMTP()
      if (sessionOperations.isBusy) void sessionOperations.signOut(async () => { await signOut({ redirect: false }) }).catch(() => undefined)
    }
  }, [])

  // Wait for both SDK and NextAuth hydration. A restored signed session does
  // not silently select a wallet; selection stays an explicit user action.
  useEffect(() => {
    if (!ready) return
    const identity = JSON.stringify([privy.authenticated, selectedKey, selectedWallet?.chainId, session?.address, wallets.map(walletKey).sort()])
    if (observedIdentity.current === identity) return
    observedIdentity.current = identity
    const previous = previousSelection.current
    previousSelection.current = selectedWallet ? { key: selectedKey, chain: selectedWallet.chainId } : null
    const chainChanged = previous?.key === selectedKey && previous.chain !== selectedWallet?.chainId
    const sessionHasWallet = !session?.address || wallets.some(wallet => wallet.address.toLowerCase() === session.address?.toLowerCase())
    if (chainChanged || !privy.authenticated || !sessionHasWallet || (selectedKey && !selectedWallet) || (selectedWallet && session?.address && session.address.toLowerCase() !== selectedWallet.address.toLowerCase())) {
      invalidate()
      if (!privy.authenticated || !selectedWallet) setSelectedKey('')
      if (session?.address || sessionOperations.isBusy) void clearSession()
    }
  }, [ready, privy.authenticated, wallets, selectedKey, selectedWallet, session?.address, invalidate, clearSession])

  useEffect(() => {
    const wallet = current.current.selectedWallet
    if (!ready || !privy.authenticated || !wallet) return
    const started = epoch.current
    const key = selectedKey
    let active = true
    let provider: WalletProvider | undefined
    const isCurrent = () => active && mounted.current && epoch.current === started && current.current.ready && current.current.authenticated && current.current.selectedKey === key
    const changed = () => {
      if (!active) return
      invalidate()
      void clearSession()
    }
    void wallet.getEthereumProvider().then(async value => {
      provider = value
      if (!isCurrent()) return
      provider.on?.('accountsChanged', changed)
      provider.on?.('chainChanged', changed)
      provider.on?.('disconnect', changed)
      const chainId = await assertWalletState(provider, wallet.address, undefined, isCurrent)
      if (isCurrent()) setWalletState({ key, revision: started, chainId })
    }).catch(() => { if (isCurrent()) { setWalletState(null); setError('The selected wallet is unavailable. Reconnect it or choose another wallet.') } })
    return () => {
      active = false
      provider?.removeListener?.('accountsChanged', changed)
      provider?.removeListener?.('chainChanged', changed)
      provider?.removeListener?.('disconnect', changed)
    }
  }, [ready, privy.authenticated, selectedKey, selectedAddress, selectedChain, revision, invalidate, clearSession])

  const chainId = walletState?.key === selectedKey && walletState.revision === revision ? walletState.chainId : undefined
  const isCurrent = useCallback(() => {
    const value = current.current
    if (!mounted.current || !value.ready || !value.authenticated || value.selectedKey !== selectedKey || epoch.current !== revision || !value.selectedWallet || chainId === undefined) return false
    try { return parseWalletChainId(value.selectedWallet.chainId) === chainId }
    catch { return false }
  }, [selectedKey, revision, chainId])
  const account = useMemo(() => selectedAddress && chainId !== undefined
    ? createSelectedWalletAccount({
      address: selectedAddress,
      getEthereumProvider: async () => {
        const wallet = current.current.selectedWallet
        if (!wallet || !isCurrent()) throw new Error('Wallet or session changed. Please sign in again.')
        return wallet.getEthereumProvider()
      },
    }, chainId, isCurrent) : null, [selectedAddress, chainId, isCurrent])

  const select = (key: string) => {
    if (key === selectedKey) return
    invalidate()
    setSelectedKey(key)
    setError('')
    void clearSession()
  }
  const login = async () => {
    if (switchingRef.current || !account || !selectedWallet || chainId === undefined || !isCurrent()) return
    if (!supportedChains.includes(chainId)) { setError('Choose Base, Base Sepolia, or Ethereum to sign in.'); return }
    setBusy(true); setError('')
    try {
      await sessionOperations.runSignIn(async (operationCurrent, submit) => {
        const stillCurrent = () => operationCurrent() && isCurrent()
        await assertWalletState(await selectedWallet.getEthereumProvider(), account.address, chainId, stillCurrent)
        const res = await fetch('/api/auth/nonce', { cache: 'no-store' })
        if (!res.ok) throw new Error(res.status === 503 ? 'Sign-in is paused during maintenance.' : 'Could not start sign-in.')
        const challenge = await res.json() as { nonce: string; issuedAt: string; expirationTime: string }
        if (!stillCurrent()) throw new Error('Wallet changed. Please sign in again.')
        const message = new SiweMessage({ domain: location.host, address: account.address, statement: 'Sign in with Ethereum to w3rk.net', uri: location.origin, version: '1', chainId, ...challenge })
        const signingAccount = createSelectedWalletAccount(selectedWallet, chainId, stillCurrent)
        const signature = await signingAccount.signMessage({ message: message.prepareMessage(), chainId })
        if (!stillCurrent()) throw new Error('Wallet changed. Please sign in again.')
        const result = await submit(() => signIn('credentials', { message: JSON.stringify(message), signature, redirect: false }))
        // A change during the callback must clear its cookie before this
        // operation releases the queue to any subsequent sign-in.
        if (!stillCurrent()) { await signOut({ redirect: false }); throw new Error('Wallet changed. Please sign in again.') }
        if (result?.error) throw new Error('Signature verification failed. Please try again.')
      })
    } catch { if (mounted.current) setError('Sign-in did not finish. Check your wallet and try again.') }
    finally { if (mounted.current) setBusy(sessionOperations.isBusy) }
  }
  const logout = async () => {
    invalidate()
    setSelectedKey('')
    setError('')
    await clearSession(true)
  }
  const switchChain = async (target: number) => {
    if (!selectedWallet || !supportedChains.includes(target) || sessionOperations.isBusy || switchingRef.current) return
    switchingRef.current = true
    setSwitching(true)
    invalidate()
    setBusy(true); setError('')
    await clearSession()
    try { await selectedWallet.switchChain(target) }
    catch { if (mounted.current) setError('Could not switch the selected wallet network.') }
    finally { switchingRef.current = false; if (mounted.current) { invalidate(); setSwitching(false) } }
  }
  return <SelectedWalletContext.Provider value={{
    ready, authenticated: privy.authenticated,
    wallets: wallets.map(wallet => ({ key: walletKey(wallet), address: wallet.address, label: wallet.meta.name || wallet.walletClientType })),
    selectedKey, account, chainId, revision, busy: busy || switching, error,
    connect: () => { if (!ready || sessionOperations.isBusy || switchingRef.current) return; if (privy.authenticated) privy.connectWallet(); else privy.login() },
    select, switchChain, login, logout, isCurrent,
  }}>{children}</SelectedWalletContext.Provider>
}
