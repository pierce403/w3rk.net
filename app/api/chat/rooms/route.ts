import { getRepository } from '../../../../lib/db'
import { HttpError } from '../../../../lib/repository'
import { authenticate, body, handle, json, text, address } from '../../../../lib/http'
export const GET = (req:Request) => handle(async()=>json(await getRepository().rooms(await authenticate(req))))
export const POST = (req:Request) => handle(async()=>{
  const user=await authenticate(req,true), data=await body(req)
  const type=text(data.type,'type')
  if(!['job','service','direct'].includes(type)) throw new HttpError(400,'Invalid room type')
  const jobId=data.jobId?text(data.jobId,'jobId'):null, serviceId=data.serviceId?text(data.serviceId,'serviceId'):null
  if((type==='job'&&(!jobId||serviceId))||(type==='service'&&(!serviceId||jobId))||(type==='direct'&&(jobId||serviceId))) throw new HttpError(400,'Invalid room reference')
  const participants=data.participantAddresses??[]
  if(!Array.isArray(participants)||participants.length>24) throw new HttpError(400,'Invalid participants')
  const repo=getRepository(), participantAddresses=participants.map(address)
  if(jobId||serviceId) {
    const target=(await repo.listings(jobId?'jobs':'services',(jobId||serviceId)!))[0]
    if(!target) throw new HttpError(404,'Listing not found')
    participantAddresses.push(target.user.address)
  }
  return json(await repo.createRoom(user,{type,title:data.title?text(data.title,'title'):null,jobId,serviceId,participantAddresses}),201)
})
