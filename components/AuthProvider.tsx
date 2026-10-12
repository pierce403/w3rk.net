'use client'
import { useActiveAccount } from 'thirdweb/react'
import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'
export default function AuthProvider({children}:{children:React.ReactNode}) {
  const account=useActiveAccount(),{data:session}=useSession()
  useEffect(()=>{
    if(session?.address&&account?.address&&session.address.toLowerCase()!==account.address.toLowerCase()) void signOut({redirect:false})
  },[account?.address,session?.address])
  return <>{children}</>
}
