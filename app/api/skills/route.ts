import { getRepository } from '../../../lib/db'
import { authenticate, body, handle, json, text, address } from '../../../lib/http'
export const GET = (req:Request) => handle(async()=>{
  const user=new URL(req.url).searchParams.get('user')
  return json(await getRepository().skills(user?address(user):undefined))
})
export const POST = (req:Request) => handle(async()=>{
  const user=await authenticate(req,true), data=await body(req)
  const result=await getRepository().createSkill(user,text(data.name,'name'))
  return json(result.skill,result.created?201:200)
})
