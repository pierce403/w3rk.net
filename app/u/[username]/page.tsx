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

interface Job {
  id: string
  title: string
  budget: string
  description: string
  createdAt: string
}

interface Service {
  id: string
  title: string
  rate: string
  description: string
  createdAt: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { data: session } = useUnifiedAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [userJobs, setUserJobs] = useState<Job[]>([])
  const [userServices, setUserServices] = useState<Service[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [username, session])

  useEffect(() => {
    if (user?.address) {
      fetchUserActivity()
    }
  }, [user?.address])

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
        // Check if displayName looks like an address (0x...) rather than an ENS name
        const hasReadableName = foundUser.displayName && 
          (foundUser.displayName.includes('.eth') || 
           foundUser.displayName.includes('.base.eth') ||
           !foundUser.displayName.startsWith('0x'))
        
        if (session?.address && foundUser && 
            session.address.toLowerCase() === foundUser.address.toLowerCase() &&
            !hasReadableName) {
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

  const fetchUserActivity = async () => {
    if (!user?.address) return
    
    setActivityLoading(true)
    try {
      // Fetch user's jobs and services
      const [jobsResponse, servicesResponse] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/services')
      ])

      if (jobsResponse.ok) {
        const allJobs = await jobsResponse.json()
        // Filter jobs by this user's address
        const userJobsFiltered = allJobs.filter((job: any) => 
          job.user.address.toLowerCase() === user.address.toLowerCase()
        )
        setUserJobs(userJobsFiltered)
      }

      if (servicesResponse.ok) {
        const allServices = await servicesResponse.json()
        // Filter services by this user's address  
        const userServicesFiltered = allServices.filter((service: any) =>
          service.user.address.toLowerCase() === user.address.toLowerCase()
        )
        setUserServices(userServicesFiltered)
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
    } finally {
      setActivityLoading(false)
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
        
        {activityLoading ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Loading activity...</p>
        ) : userJobs.length > 0 || userServices.length > 0 ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Recent Jobs */}
            {userJobs.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0ea5e9' }}>
                  🔍 Posted Jobs ({userJobs.length})
                </h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {userJobs.slice(0, 3).map((job, index) => (
                    <div key={job.id} style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '6px',
                      borderLeft: '3px solid #0ea5e9'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                            <a href={`/j/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {job.title}
                            </a>
                          </h5>
                          <div style={{ fontSize: '0.8rem', color: '#0ea5e9', marginBottom: '0.25rem' }}>
                            {job.budget} USDC
                          </div>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.8rem', 
                            color: '#666',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {job.description}
                          </p>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginLeft: '1rem' }}>
                          {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {userJobs.length > 3 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <a href="/j" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
                      View all {userJobs.length} jobs →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Recent Services */}
            {userServices.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#10b981' }}>
                  🛠️ Posted Services ({userServices.length})
                </h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {userServices.slice(0, 3).map((service, index) => (
                    <div key={service.id} style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '6px',
                      borderLeft: '3px solid #10b981'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                            <a href={`/s/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {service.title}
                            </a>
                          </h5>
                          <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.25rem' }}>
                            {service.rate} USDC
                          </div>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.8rem', 
                            color: '#666',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {service.description}
                          </p>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginLeft: '1rem' }}>
                          {new Date(service.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {userServices.length > 3 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <a href="/s" style={{ color: '#10b981', textDecoration: 'none' }}>
                      View all {userServices.length} services →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            {isOwner ? 'You haven\'t posted any jobs or services yet.' : 'No recent activity.'}
            {isOwner && (
              <span style={{ display: 'block', marginTop: '0.5rem' }}>
                <a href="/post" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Post a job</a>
                {' or '}
                <a href="/advertise" style={{ color: '#10b981', textDecoration: 'none' }}>advertise a service</a>
                {' to get started!'}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
