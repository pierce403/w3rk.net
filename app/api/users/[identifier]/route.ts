import { getRepository } from '../../../../lib/db'
import { handle, json } from '../../../../lib/http'
import { getDisplayName } from '../../../../lib/nameResolver'
export const GET = (_req:Request,{params}:{params:Promise<{identifier:string}>}) => handle(async()=>{
  const user=await getRepository().findUser((await params).identifier)
  if(!user) return json({error:'User not found'},404)
  return json({...user,displayName:await getDisplayName(user.address),createdAt:user.joinedAt})
})
