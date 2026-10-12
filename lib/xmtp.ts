'use client'
import { Client, type Signer, type Dm, type DecodedMessage } from '@xmtp/browser-sdk'
import {xmtpSignerKey} from './xmtp-signer'
let client:Client|null=null
let initializing:Promise<Client|null>|null=null
let owner:string|null=null
let generation=0
const conversations=new Map<string,Promise<Dm|null>>()
const stops=new Set<()=>void>()
export interface NetworkMessage {id:string;content:string;senderInboxId:string;senderAddress:string|null;sentAt:Date;xmtpId:string}
export async function initializeXMTP(signer:Signer,isCurrent:()=>boolean=()=>true):Promise<Client|null>{
  const identity=await xmtpSignerKey(signer)
  if(!isCurrent())return null
  if(owner===identity){if(client)return client;if(initializing)return initializing}
  disconnectXMTP();owner=identity
  const current=generation
  initializing=Client.create(signer,{env:'production'}).then(value=>{
    if(current!==generation||!isCurrent()){value.close();return null}client=value;return value
  }).catch(()=>null).finally(()=>{if(current===generation)initializing=null})
  return initializing
}
export const getXMTPClient=()=>client
export function disconnectXMTP(){generation++;for(const stop of stops)stop();stops.clear();client?.close();client=null;owner=null;initializing=null;conversations.clear()}
export async function createXMTPConversation(address:string):Promise<Dm|null>{
  const current=client,key=address.toLowerCase()
  if(!current)return null
  if(conversations.has(key))return conversations.get(key)!
  const promise=(async()=>{
    const identifier={identifier:key,identifierKind:'Ethereum' as const}
    const inboxId=await current.findInboxIdByIdentifier(identifier)
    if(!inboxId)return null
    await current.conversations.sync()
    return (await current.conversations.getDmByInboxId(inboxId))??await current.conversations.newDm(inboxId)
  })().catch(()=>null)
  conversations.set(key,promise)
  const result=await promise
  if(!result)conversations.delete(key)
  return result
}
export async function sendXMTPMessage(address:string,content:string,canSend:()=>boolean=()=>true){
  const current=generation
  try{const conversation=await createXMTPConversation(address);if(!conversation||current!==generation||!canSend())return{success:false,error:'Recipient unavailable on XMTP'};return{success:true,xmtpId:await conversation.send(content)}}catch{return{success:false,error:'XMTP send failed'}}
}
async function normalize(conversation:Dm,message:DecodedMessage):Promise<NetworkMessage|null>{
  if(typeof message.content!=='string')return null
  const member=(await conversation.members()).find(m=>m.inboxId===message.senderInboxId)
  const identifier=member?.accountIdentifiers.find(i=>i.identifierKind==='Ethereum')
  return{id:message.id,content:message.content,senderInboxId:message.senderInboxId,senderAddress:identifier?.identifier??null,sentAt:new Date(Number(message.sentAtNs/1000000n)),xmtpId:message.id}
}
export async function listenForXMTPMessages(address:string,onMessage:(message:NetworkMessage)=>void):Promise<()=>void>{
  const conversation=await createXMTPConversation(address)
  if(!conversation)return()=>{}
  const stream=await conversation.stream();let active=true
  const stop=()=>{if(active){active=false;stops.delete(stop);void stream.return()}}
  stops.add(stop)
  void(async()=>{try{for await(const message of stream){if(!active)break;const normalized=await normalize(conversation,message);if(active&&normalized)onMessage(normalized)}}catch{}finally{stop()}})()
  return stop
}
export async function getXMTPMessageHistory(address:string):Promise<NetworkMessage[]>{
  const conversation=await createXMTPConversation(address)
  if(!conversation)return[]
  await conversation.sync()
  const messages=await conversation.messages()
  return(await Promise.all(messages.map(m=>normalize(conversation,m)))).filter((m):m is NetworkMessage=>m!==null)
}
