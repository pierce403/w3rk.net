export interface ChatEnvelope { application:'w3rk.net/chat/v1';roomId:string;messageId:string;text:string }
export function encodeChatEnvelope(roomId:string,messageId:string,text:string){
  return JSON.stringify({application:'w3rk.net/chat/v1',roomId,messageId,text} satisfies ChatEnvelope)
}
export function decodeChatEnvelope(content:string,roomId:string):ChatEnvelope|null{
  try{
    const value=JSON.parse(content)
    if(!value||Object.keys(value).sort().join(',')!=='application,messageId,roomId,text')return null
    if(value.application!=='w3rk.net/chat/v1'||value.roomId!==roomId)return null
    if(typeof value.messageId!=='string'||!value.messageId||value.messageId.length>512)return null
    if(typeof value.text!=='string'||!value.text.trim()||value.text.length>20000)return null
    return value
  }catch{return null}
}
// The server must accept the message before any external delivery. A failed
// secondary delivery never converts a saved message into a retryable save error.
export async function persistThenDeliver<T extends {id:string}>(options:{
  roomId:string;content:string;isCurrent:()=>boolean;persist:()=>Promise<T>;
  saved:(message:T)=>void;deliver?:((envelope:string)=>Promise<{success:boolean;xmtpId?:string}>)
}){
  const message=await options.persist()
  if(!options.isCurrent())return {message,delivery:'context-changed' as const}
  options.saved(message)
  if(!options.deliver)return {message,delivery:'unavailable' as const}
  try{
    const result=await options.deliver(encodeChatEnvelope(options.roomId,message.id,options.content))
    return {message,delivery:result.success?'sent' as const:'failed' as const,xmtpId:result.xmtpId}
  }catch{return {message,delivery:'failed' as const}}
}
