'use client'
import { useEffect, useState, useRef } from 'react'
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth'
import { useParams } from 'next/navigation'
import { useXMTP } from '../../../hooks/useXMTP'
import { sendXMTPMessage, listenForXMTPMessages } from '../../../lib/xmtp'

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

  useEffect(() => {
    if (status === 'authenticated' && session?.address && roomId) {
      fetchChatRoom()
      fetchMessages()
    }
  }, [session, status, roomId])

  // Set up XMTP message listener when ready
  useEffect(() => {
    if (isXMTPReady && chatRoom && session?.address) {
      // For now, focus on 1:1 conversations - get the other participant
      const otherParticipants = chatRoom.participants
        .map(p => p.user.address)
        .filter(addr => addr !== session.address)
      
      if (otherParticipants.length === 1) {
        setupXMTPListener(otherParticipants[0])
      }
    }
  }, [isXMTPReady, chatRoom, session?.address])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChatRoom = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const rooms = await response.json()
        const room = rooms.find((r: ChatRoom) => r.id === roomId)
        setChatRoom(room || null)
      }
    } catch (error) {
      console.error('Error fetching chat room:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const msgs = await response.json()
        setMessages(msgs)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set up XMTP message listener for real-time cross-app messaging
  const setupXMTPListener = async (participantAddress: string) => {
    try {
      console.log('👂 Setting up XMTP listener for:', participantAddress)
      
      await listenForXMTPMessages(participantAddress, (xmtpMessage) => {
        // Add XMTP message to local state if not already present
        setMessages(prev => {
          const exists = prev.some(m => m.xmtpId === xmtpMessage.xmtpId)
          if (exists) return prev
          
          // Convert XMTP message format to our message format
          const newMsg: ChatMessage = {
            id: xmtpMessage.id,
            content: xmtpMessage.content,
            createdAt: xmtpMessage.sentAt.toISOString(),
            xmtpId: xmtpMessage.xmtpId,
            sender: {
              address: xmtpMessage.senderAddress,
              displayName: `${xmtpMessage.senderAddress.slice(0, 6)}...${xmtpMessage.senderAddress.slice(-4)}`,
              ensName: undefined,
              baseName: undefined
            }
          }
          
          return [...prev, newMsg]
        })
        
        // Also store in database for persistence
        fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: xmtpMessage.content,
            xmtpId: xmtpMessage.xmtpId
          })
        }).catch(error => console.error('Failed to store XMTP message in database:', error))
      })
    } catch (error) {
      console.error('Error setting up XMTP listener:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const messageContent = newMessage.trim()
      let xmtpId: string | null = null

      // Send via XMTP for cross-app messaging (if available)
      let xmtpResult = null
      if (isXMTPReady && chatRoom) {
        const otherParticipants = chatRoom.participants
          .map(p => p.user.address)
          .filter(addr => addr !== session?.address)
        
        if (otherParticipants.length === 1) {
          console.log('📤 Sending message via XMTP...')
          xmtpResult = await sendXMTPMessage(otherParticipants[0], messageContent)
          
          if (xmtpResult.success) {
            console.log('✅ Message sent via XMTP for cross-app messaging')
          } else {
            console.warn('⚠️ XMTP send failed, using database only:', xmtpResult.error)
          }
        }
      }

      // Also store in database for persistence and fallback
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          xmtpId: xmtpResult?.success ? xmtpResult.xmtpId : null
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        
        const method = xmtpResult?.success ? 'XMTP + Database' : 'Database only'
        console.log(`📨 Message sent via ${method}`)
        
        if (xmtpResult?.success) {
          console.log('🌐 Message available for cross-app messaging via XMTP')
        }
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (status === 'loading' || loading) {
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
            const isMyMessage = message.sender.address === session.address
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
