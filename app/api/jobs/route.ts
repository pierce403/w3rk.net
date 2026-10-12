import { getRepository } from '../../../lib/db'
import { authenticate, body, handle, json, text } from '../../../lib/http'
import { getDisplayName } from '../../../lib/nameResolver'
export const GET = () => handle(async () => {
  const rows=await getRepository().listings('jobs')
  return json(await Promise.all(rows.map(async row=>({...row,user:{...row.user,displayName:await getDisplayName(row.user.address)}}))))
})
export const POST = (req:Request) => handle(async () => {
  const address=await authenticate(req,true), data=await body(req)
  const result=await getRepository().createListing('jobs',address,text(data.title,'title'),text(data.budget,'budget'),text(data.desc,'description',20000))
  return json(result,201)
})
