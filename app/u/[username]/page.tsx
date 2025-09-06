'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth'
import UserSkills from '../../../components/UserSkills'
import { getDisplayName } from '../../../lib/nameResolver'

interface UserProfile {
  id: string
  address: string
  displayName: string
  ensName?: string
  baseName?: string
  farcasterHandle?: string
  bio?: string
  createdAt: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { data: session } = useUnifiedAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [username, session])

  const fetchUser = async () => {
    if (!username) return
    
    try {
      let searchAddress = username
      
      // If username looks like an ENS name, resolve it to an address first
      if (username.includes('.eth') || username.includes('.base.eth')) {
        // For now, search by the username directly in case it's stored as displayName
        // In a full implementation, you'd resolve ENS -> address first
        searchAddress = username
      }
      
      // Search by address or ENS name
      const response = await fetch(`/api/users/${encodeURIComponent(searchAddress)}`)
      
      if (response.ok) {
        const foundUser = await response.json()
        setUser(foundUser)
        
        // Check if current user is viewing their own profile
        if (session?.address && foundUser) {
          setIsOwner(session.address.toLowerCase() === foundUser.address.toLowerCase())
        }
        
        // Show name prompt if user is viewing their own profile and has no ENS/Base name
        if (session?.address && foundUser && 
            session.address.toLowerCase() === foundUser.address.toLowerCase() &&
            !foundUser.ensName && !foundUser.baseName) {
          setShowNamePrompt(true)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    }
  }

  if (!user) {
    return (
      <div className="card">
        <h2>User Not Found</h2>
        <p>The user &quot;{username}&quot; could not be found.</p>
        <a href="/u" className="btn">← Back to Users</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Name Setup Prompt */}
      {showNamePrompt && isOwner && (
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <h3>🎯 Set Up Your Profile Name</h3>
          <p>Make it easier for people to find you! Consider setting up:</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <a 
              href="https://app.ens.domains" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn small"
            >
              Get ENS Name
            </a>
            <a 
              href="https://www.base.org/names" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn small"
            >
              Get Base Name
            </a>
            <button 
              className="btn small secondary" 
              onClick={() => setShowNamePrompt(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>
              {user.displayName}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              {user.address}
            </div>
            {user.bio && (
              <p style={{ margin: 0, marginBottom: '1rem' }}>
                {user.bio}
              </p>
            )}
          </div>
          {isOwner && (
            <a href="/profile" className="btn small">
              Edit Profile
            </a>
          )}
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem' }}>
            <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          {user.ensName && (
            <div style={{ fontSize: '0.875rem' }}>
              <strong>ENS:</strong> {user.ensName}
            </div>
          )}
          
          {user.baseName && (
            <div style={{ fontSize: '0.875rem' }}>
              <strong>Base Name:</strong> {user.baseName}
            </div>
          )}
          
          {user.farcasterHandle && (
            <div style={{ fontSize: '0.875rem' }}>
              <strong>Farcaster:</strong> 
              <a 
                href={`https://warpcast.com/${user.farcasterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#8a63d2', marginLeft: '0.5rem' }}
              >
                @{user.farcasterHandle}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* User's Skills */}
      <div className="card">
        <UserSkills 
          userAddress={user.address} 
          displayName={user.displayName} 
        />
      </div>

      {/* User's Recent Activity */}
      <div className="card">
        <h3>Recent Activity</h3>
        <p style={{ color: '#666' }}>
          Jobs posted, services offered, and other activity will appear here.
        </p>
      </div>
    </div>
  )
}
