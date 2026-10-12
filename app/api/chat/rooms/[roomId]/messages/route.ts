import { getRepository } from '../../../../../../lib/db'
import { authenticate, body, handle, json, text } from '../../../../../../lib/http'
type Context={params:Promise<{roomId:string}>}
export const GET=(req:Request,{params}:Context)=>handle(async()=>json(await getRepository().messages((await params).roomId,await authenticate(req))))
export const POST=(req:Request,{params}:Context)=>handle(async()=>{
  const user=await authenticate(req,true), data=await body(req)
  return json(await getRepository().createMessage((await params).roomId,user,text(data.content,'content',20000),data.xmtpId?text(data.xmtpId,'xmtpId'):null),201)
})
