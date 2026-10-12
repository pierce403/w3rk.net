import { stringToHex, type Hex } from 'viem'

export type WalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}
export type SelectedWallet = {
  address: string
  getEthereumProvider: () => Promise<WalletProvider>
}

export function parseWalletChainId(value: unknown): number {
  if (typeof value === 'string' && value.startsWith('eip155:') && !/^eip155:[0-9]+$/.test(value)) throw new Error('The wallet returned an invalid network.')
  const raw = typeof value === 'string' && value.startsWith('eip155:') ? value.slice(7) : value
  if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(raw))) {
    throw new Error('The wallet returned an invalid network.')
  }
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('The wallet returned an invalid network.')
  return id
}

export async function assertWalletState(provider: WalletProvider, address: string, chainId: number | undefined, isCurrent: () => boolean): Promise<number> {
  if (!isCurrent()) throw new Error('Wallet or session changed. Please sign in again.')
  const accounts = await provider.request({ method: 'eth_accounts' })
  const chain = parseWalletChainId(await provider.request({ method: 'eth_chainId' }))
  if (!isCurrent() || !Array.isArray(accounts) || !accounts.some(value => typeof value === 'string' && value.toLowerCase() === address.toLowerCase()) || (chainId !== undefined && chain !== chainId)) {
    throw new Error('Wallet or network changed. Please sign in again.')
  }
  return chain
}

export function createSelectedWalletAccount(wallet: SelectedWallet, chainId: number, isCurrent: () => boolean) {
  return {
    address: wallet.address,
    async signMessage(input: { message: string; chainId?: number }): Promise<Hex> {
      if (input.chainId !== undefined && input.chainId !== chainId) throw new Error('Wallet network changed. Please sign in again.')
      if (!isCurrent()) throw new Error('Wallet or session changed. Please sign in again.')
      const provider = await wallet.getEthereumProvider()
      await assertWalletState(provider, wallet.address, chainId, isCurrent)
      // Select the address explicitly. Never infer a signing account from array order.
      const signature = await provider.request({ method: 'personal_sign', params: [stringToHex(input.message), wallet.address] })
      await assertWalletState(await wallet.getEthereumProvider(), wallet.address, chainId, isCurrent)
      if (typeof signature !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(signature)) throw new Error('The wallet returned an invalid signature.')
      return signature as Hex
    },
  }
}

// A logout waits for an already-submitted NextAuth callback before clearing its
// cookie. No newer login can start while that cleanup is pending.
export function createWalletSessionController() {
  let generation = 0
  let pending: Promise<void> | null = null
  let callback: Promise<unknown> | null = null
  let clearing: Promise<void> | null = null
  return {
    get isBusy() { return pending !== null || clearing !== null },
    invalidate() { generation += 1 },
    async runSignIn(action: (isCurrent: () => boolean, submit: <T>(action: () => Promise<T>) => Promise<T>) => Promise<void>) {
      if (pending || clearing) throw new Error('Wait for the current wallet operation to finish.')
      const started = generation
      const isCurrent = () => generation === started
      const submit = async <T>(action: () => Promise<T>): Promise<T> => {
        if (!isCurrent()) throw new Error('Wallet or session changed. Please sign in again.')
        const request = Promise.resolve().then(() => {
          if (!isCurrent()) throw new Error('Wallet or session changed. Please sign in again.')
          return action()
        })
        callback = request
        try { return await request } finally { if (callback === request) callback = null }
      }
      const task = Promise.resolve().then(() => action(isCurrent, submit))
      pending = task
      try { await task } finally { if (pending === task) pending = null }
    },
    signOut(action: () => Promise<void>): Promise<void> {
      generation += 1
      // Each requested cleanup still runs (for example, Privy logout requested
      // while automatic NextAuth-only cleanup was already in progress).
      // A wallet prompt may never resolve. It cannot submit after invalidation,
      // so only a callback already sent to NextAuth must precede cookie cleanup.
      const previous = clearing ?? callback
      const task = Promise.resolve(previous).catch(() => undefined).then(action)
      clearing = task
      return task.finally(() => { if (clearing === task) clearing = null })
    },
  }
}
