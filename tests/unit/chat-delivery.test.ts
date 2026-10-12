import test from 'node:test'
import assert from 'node:assert/strict'
import {decodeChatEnvelope,encodeChatEnvelope,persistThenDeliver} from '../../lib/chat-delivery'
test('XMTP room envelope rejects another room and unattributed external DM',()=>{
 const encoded=encodeChatEnvelope('room-a','message-a','hello')
 assert.equal(decodeChatEnvelope(encoded,'room-a')?.messageId,'message-a')
 assert.equal(decodeChatEnvelope(encoded,'room-b'),null)
 assert.equal(decodeChatEnvelope('ordinary external direct message','room-a'),null)
})
test('failed server authorization or maintenance response cannot send externally',async()=>{
 let sent=false
 await assert.rejects(persistThenDeliver({roomId:'a',content:'x',isCurrent:()=>true,persist:async()=>{throw Error('503')},saved:()=>{},deliver:async()=>{sent=true;return{success:true}}}))
 assert.equal(sent,false)
})
test('navigation while a write is pending prevents stale-room state and delivery',async()=>{
 let context='a',saved=false,sent=false,resolve!:(value:{id:string})=>void
 const pending=persistThenDeliver({roomId:'a',content:'x',isCurrent:()=>context==='a',persist:()=>new Promise<{id:string}>(r=>{resolve=r}),saved:()=>{saved=true},deliver:async()=>{sent=true;return{success:true}}})
 context='b';resolve({id:'m'});assert.equal((await pending).delivery,'context-changed');assert.equal(saved,false);assert.equal(sent,false)
})
test('failed external delivery preserves the successful database result without retrying',async()=>{
 let writes=0,saved=false
 const result=await persistThenDeliver({roomId:'a',content:'x',isCurrent:()=>true,persist:async()=>{writes++;return{id:'m'}},saved:()=>{saved=true},deliver:async encoded=>{assert.equal(decodeChatEnvelope(encoded,'a')?.messageId,'m');throw Error('Network failure')}})
 assert.equal(result.delivery,'failed');assert.equal(saved,true);assert.equal(writes,1)
})
