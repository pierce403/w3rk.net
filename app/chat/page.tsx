'use client'
import { useEffect, useState } from 'react'
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth'

interface ChatRoom {
  id: string
  type: string
  title: string
  updatedAt: string
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
  messages: Array<{
    content: string
    createdAt: string
    sender: {
      address: string
      displayName: string
    }
  }>
}

export default function ChatPage() {
  const { data: session, status } = useUnifiedAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.address) {
      fetchChatRooms()
    }
  }, [session, status])

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const rooms = await response.json()
        setChatRooms(rooms)
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session?.address) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Chat</h1>
        <p>Please connect your wallet to access chat.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Chat</h1>
        <p>Loading your conversations...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Your Conversations</h1>
      
      {chatRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No conversations yet.</p>
          <p>Start a conversation by clicking the 💬 Chat button on any job or service.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chatRooms.map((room) => (
            <div 
              key={room.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '1rem',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9'
              }}
              onClick={() => window.location.href = `/chat/${room.id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                    {room.title || `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Chat`}
                  </h3>
                  
                  {room.job && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      Job: {room.job.title} by {room.job.user.displayName}
                    </p>
                  )}
                  
                  {room.service && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      Service: {room.service.title} by {room.service.user.displayName}
                    </p>
                  )}
                  
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    Participants: {room.participants.map(p => p.user.displayName).join(', ')}
                  </div>
                  
                  {room.messages.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                      <strong>{room.messages[0].sender.displayName}:</strong> {room.messages[0].content.slice(0, 100)}
                      {room.messages[0].content.length > 100 && '...'}
                    </div>
                  )}
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
                  {new Date(room.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
