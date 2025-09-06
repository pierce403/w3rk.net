'use client'

import { useState, useEffect } from 'react'
import { getDisplayName } from '../lib/nameResolver'

export function useENSName(address: string | undefined) {
  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      setIsLoading(true)
      getDisplayName(address)
        .then(name => {
          setDisplayName(name)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to resolve name:', error)
          // Fallback to shortened address
          setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`)
          setIsLoading(false)
        })
    }
  }, [address])

  return { displayName, isLoading }
}
