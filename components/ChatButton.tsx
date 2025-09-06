'use client'
import { useState } from 'react'
import { useUnifiedAuth } from '../hooks/useUnifiedAuth'

interface ChatButtonProps {
  jobId?: string
  serviceId?: string
  title?: string
  ownerAddress?: string
  type: 'job' | 'service'
}

export default function ChatButton({ jobId, serviceId, title, ownerAddress, type }: ChatButtonProps) {
  const { data: session } = useUnifiedAuth()
  const [isCreating, setIsCreating] = useState(false)

  const handleStartChat = async () => {
    if (!session?.address || !ownerAddress) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          jobId: jobId || null,
          serviceId: serviceId || null,
          title: `Chat about: ${title}`,
          participantAddresses: [ownerAddress]
        })
      })

      if (response.ok) {
        const chatRoom = await response.json()
        // Redirect to chat interface or open chat modal
        window.location.href = `/chat/${chatRoom.id}`
      } else {
        throw new Error('Failed to create chat')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      alert('Failed to start chat. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Don't show chat button if user is not logged in or is the owner
  if (!session?.address || session.address === ownerAddress) {
    return null
  }

  return (
    <button 
      className="btn small" 
      onClick={handleStartChat}
      disabled={isCreating}
      title={`Start a conversation about this ${type}`}
    >
      {isCreating ? '💬 Starting...' : '💬 Chat'}
    </button>
  )
}
