'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSelectedWallet } from '../components/AuthProvider'
import { createXMTPSigner } from '../lib/xmtp-signer'
import { initializeXMTP, disconnectXMTP, getXMTPClient } from '../lib/xmtp'

export function useXMTP() {
  const { account, chainId, isCurrent: walletIsCurrent, revision, busy } = useSelectedWallet()
  const { data: session } = useSession()
  const [isXMTPReady, setReady] = useState(false)
  const [xmtpError, setError] = useState<string | null>(null)
  const [isInitializing, setInitializing] = useState(false)
  useEffect(() => {
    let active = true
    setReady(false); setError(null); setInitializing(false)
    if (busy || !account || account.address.toLowerCase() !== session?.address?.toLowerCase()) { disconnectXMTP(); return }
    const isCurrent = () => active && walletIsCurrent() && chainId === session.chainId
    try {
      const signer = createXMTPSigner(account, session, chainId, isCurrent)
      setInitializing(true)
      void initializeXMTP(signer, isCurrent).then(client => {
        if (active) { setReady(!!client); if (!client) setError('XMTP unavailable. You can still use this chat.') }
      }).catch(() => {
        if (active) setError('XMTP unavailable. You can still use this chat.')
      }).finally(() => { if (active) setInitializing(false) })
    } catch (error) {
      disconnectXMTP()
      setError(error instanceof Error ? error.message : 'XMTP unavailable. You can still use this chat.')
    }
    return () => { active = false; disconnectXMTP() }
  }, [account, chainId, walletIsCurrent, revision, busy, session?.address, session?.chainId, session?.walletType])
  return { isXMTPReady, xmtpError, isInitializing, xmtpClient: getXMTPClient(), userAddress: account?.address ?? null }
}
