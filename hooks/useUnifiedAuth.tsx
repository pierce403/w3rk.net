'use client'
import { useSession } from 'next-auth/react'
// Only a verified server session grants application access. Wallet connection alone is not authentication.
export const useUnifiedAuth=useSession
