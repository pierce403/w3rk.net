import { getServerSession } from 'next-auth'
import { getAuthOptions } from './auth'
export async function getAuthenticatedUser(_req: Request): Promise<string | null> {
  const session = await getServerSession(getAuthOptions())
  return session?.address ?? null
}
