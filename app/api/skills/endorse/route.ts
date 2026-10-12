import { getRepository } from '../../../../lib/db'
import { authenticate, body, handle, json, text, address } from '../../../../lib/http'
export const POST = (req:Request) => handle(async()=>{
  const user=await authenticate(req,true), data=await body(req)
  return json(await getRepository().endorse(user,address(data.user),text(data.skill,'skill')),201)
})
