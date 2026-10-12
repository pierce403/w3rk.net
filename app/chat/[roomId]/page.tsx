'use client'
import { useEffect, useState, useRef } from 'react'
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth'
import { useParams } from 'next/navigation'
import { useXMTP } from '../../../hooks/useXMTP'
import { sendXMTPMessage, listenForXMTPMessages, getXMTPMessageHistory } from '../../../lib/xmtp'
import {decodeChatEnvelope,persistThenDeliver} from '../../../lib/chat-delivery'

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  xmtpId?: string
  sender: {
    address: string
    displayName: string
    ensName?: string
    baseName?: string
  }
}

interface ChatRoom {
  id: string
  type: string
  title: string
  job?: {
    id: string
    title: string
    user: {
      address: string
      displayName: string
    }
  }
  service?: {
    id: string
    title: string
    user: {
      address: string
      displayName: string
    }
  }
  participants: Array<{
    user: {
      address: string
      displayName: string
      ensName?: string
      baseName?: string
    }
  }>
}

export default function ChatRoomPage() {
  const params = useParams()
  const roomId = params?.roomId as string
  const { data: session, status } = useUnifiedAuth()
  const { isXMTPReady, xmtpError, isInitializing } = useXMTP()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextKey=status==='authenticated'&&session?.address&&roomId?`${session.address.toLowerCase()}:${roomId}`:''
  const currentContext=useRef(contextKey)
  currentContext.current=contextKey
  const [loadedContext,setLoadedContext]=useState('')
  const [deliveryNotice,setDeliveryNotice]=useState('')

  useEffect(() => {
    const controller=new AbortController()
    setChatRoom(null);setMessages([]);setNewMessage('');setDeliveryNotice('');setSending(false);setLoadedContext('');setLoading(!!contextKey)
    if(!contextKey)return()=>controller.abort()
    void(async()=>{
      try{
        const [roomsResponse,messagesResponse]=await Promise.all([
          fetch('/api/chat/rooms',{signal:controller.signal}),
          fetch(`/api/chat/rooms/${roomId}/messages`,{signal:controller.signal}),
        ])
        if(!roomsResponse.ok||!messagesResponse.ok)throw Error('Chat unavailable')
        const rooms=await roomsResponse.json() as ChatRoom[],items=await messagesResponse.json() as ChatMessage[]
        if(controller.signal.aborted||currentContext.current!==contextKey)return
        const room=rooms.find(r=>r.id===roomId)
        setChatRoom(room??null);setMessages(room?items:[])
      }catch{
        if(!controller.signal.aborted&&currentContext.current===contextKey){setChatRoom(null);setMessages([])}
      }finally{
        if(!controller.signal.aborted&&currentContext.current===contextKey){setLoading(false);setLoadedContext(contextKey)}
      }
    })()
    return()=>controller.abort()
  },[contextKey,roomId])

  // Only explicitly attributed app envelopes enter this room. Generic external
  // DMs and another room's messages are never assigned to the open conversation.
  useEffect(() => {
    if(!isXMTPReady||!chatRoom||chatRoom.id!==roomId||loadedContext!==contextKey||!session?.address)return
    const other=chatRoom.participants.map(p=>p.user.address).filter(a=>a.toLowerCase()!==session.address!.toLowerCase())
    if(other.length!==1)return
    let active=true,stop:undefined|(()=>void)
    const receive=(message:Awaited<ReturnType<typeof getXMTPMessageHistory>>[number])=>{
      if(!active||currentContext.current!==contextKey||!message.senderAddress)return
      const envelope=decodeChatEnvelope(message.content,chatRoom.id)
      if(!envelope||!chatRoom.participants.some(p=>p.user.address.toLowerCase()===message.senderAddress!.toLowerCase()))return
      setMessages(prev=>prev.some(m=>m.id===envelope.messageId||m.xmtpId===message.xmtpId)?prev:[...prev,{
        id:envelope.messageId,content:envelope.text,createdAt:message.sentAt.toISOString(),xmtpId:message.xmtpId,
        sender:{address:message.senderAddress!,displayName:message.senderAddress!.slice(0,6)+'...'+message.senderAddress!.slice(-4)}
      }].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)))
    }
    void listenForXMTPMessages(other[0],receive).then(cleanup=>{if(active)stop=cleanup;else cleanup()}).catch(()=>{})
    void getXMTPMessageHistory(other[0]).then(items=>items.forEach(receive)).catch(()=>{})
    return()=>{active=false;stop?.()}
  },[isXMTPReady,chatRoom,roomId,loadedContext,contextKey,session?.address])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const room=chatRoom,context=contextKey,content=newMessage.trim()
    if(!content||sending||!context||loadedContext!==context||!room||room.id!==roomId)return
    const isCurrent=()=>currentContext.current===context
    const recipients=room.participants.map(p=>p.user.address).filter(a=>a.toLowerCase()!==session?.address?.toLowerCase())
    setSending(true);setDeliveryNotice('')
    try{
      const result=await persistThenDeliver({roomId:room.id,content,isCurrent,
        persist:async()=>{
          const response=await fetch(`/api/chat/rooms/${room.id}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content})})
          if(!response.ok)throw Error('Message was not saved. The chat may be read-only or unavailable.')
          return await response.json() as ChatMessage
        },
        saved:message=>{
          setMessages(prev=>prev.some(m=>m.id===message.id)?prev:[...prev,message]);setNewMessage('')
          setDeliveryNotice('Saved to chat. Checking XMTP delivery…')
        },
        deliver:isXMTPReady&&recipients.length===1?envelope=>sendXMTPMessage(recipients[0],envelope,isCurrent):undefined,
      })
      if(!isCurrent())return
      if(result.xmtpId)setMessages(prev=>prev.map(m=>m.id===result.message.id?{...m,xmtpId:result.xmtpId}:m))
      setDeliveryNotice(result.delivery==='sent'?'Saved to chat and delivered via XMTP.':result.delivery==='failed'?'Saved to chat. XMTP delivery failed.':'Saved to chat. XMTP delivery is unavailable.')
    }catch{
      if(isCurrent())setDeliveryNotice('Could not confirm the save. Reload this chat before trying again.')
    }finally{if(isCurrent())setSending(false)}
  }

  if (status === 'loading' || (status === 'authenticated' && (loading||loadedContext!==contextKey))) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!session?.address) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Chat</h1>
        <p>Please connect your wallet to access chat.</p>
      </div>
    )
  }

  if (!chatRoom) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Chat Room Not Found</h1>
                    <p>This chat room doesn&apos;t exist or you don&apos;t have access to it.</p>
        <a href="/chat" className="btn">← Back to Chats</a>
      </div>
    )
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #ddd', 
        backgroundColor: '#f9f9f9' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/chat" style={{ textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
          <div>
            <h2 style={{ margin: '0', fontSize: '1.2rem' }}>
              {chatRoom.title || `${chatRoom.type.charAt(0).toUpperCase() + chatRoom.type.slice(1)} Chat`}
            </h2>
            
            {chatRoom.job && (
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Job: {chatRoom.job.title}
              </p>
            )}
            
            {chatRoom.service && (
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Service: {chatRoom.service.title}
              </p>
            )}
            
            <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.8rem' }}>
              {chatRoom.participants.map(p => p.user.displayName).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {deliveryNotice&&<p role="status" style={{padding:'0.5rem 1rem'}}>{deliveryNotice}</p>}
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.sender.address.toLowerCase() === session.address!.toLowerCase()
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                  maxWidth: '70%'
                }}
              >
                <div
                  style={{
                    backgroundColor: isMyMessage ? '#007bff' : '#f1f1f1',
                    color: isMyMessage ? 'white' : 'black',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    borderBottomRightRadius: isMyMessage ? '0.25rem' : '1rem',
                    borderBottomLeftRadius: isMyMessage ? '1rem' : '0.25rem'
                  }}
                >
                  <div style={{ fontSize: '0.95rem' }}>{message.content}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    marginTop: '0.25rem',
                    opacity: 0.8
                  }}>
                    {!isMyMessage && `${message.sender.displayName} • `}
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form 
        onSubmit={sendMessage}
        style={{ 
          padding: '1rem', 
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '0.5rem'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            border: '1px solid #ddd', 
            borderRadius: '1.5rem',
            fontSize: '1rem',
            outline: 'none'
          }}
          autoFocus
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || sending}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            opacity: (!newMessage.trim() || sending) ? 0.5 : 1
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
