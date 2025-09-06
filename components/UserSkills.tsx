'use client'
import { useState, useEffect } from 'react'
import { useUnifiedAuth } from '../hooks/useUnifiedAuth'

interface Skill {
  id: string
  name: string
  user: string
  endorsements: string[]
  endorsementDetails?: Array<{
    address: string
    displayName: string
    endorsedAt: string
  }>
}

interface UserSkillsProps {
  userAddress: string
  displayName: string
}

export default function UserSkills({ userAddress, displayName }: UserSkillsProps) {
  const { data: session } = useUnifiedAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [endorsing, setEndorsing] = useState<string | null>(null)

  useEffect(() => {
    fetchUserSkills()
  }, [userAddress])

  const fetchUserSkills = async () => {
    try {
      const response = await fetch(`/api/skills?user=${userAddress}`)
      if (response.ok) {
        const userSkills = await response.json()
        setSkills(userSkills)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const endorseSkill = async (skillName: string) => {
    if (!session?.address || endorsing) return

    setEndorsing(skillName)
    try {
      const response = await fetch('/api/skills/endorse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: userAddress,
          skill: skillName
        })
      })

      if (response.ok) {
        // Refresh skills to show updated endorsement count
        await fetchUserSkills()
      } else {
        const error = await response.json()
        if (error.error === 'Already endorsed') {
          alert('You have already endorsed this skill!')
        } else {
          alert(error.error || 'Failed to endorse skill')
        }
      }
    } catch (error) {
      console.error('Error endorsing skill:', error)
      alert('Failed to endorse skill. Please try again.')
    } finally {
      setEndorsing(null)
    }
  }

  if (loading) {
    return <div>Loading skills...</div>
  }

  const isOwnProfile = session?.address === userAddress
  const canEndorse = session?.address && !isOwnProfile

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>{isOwnProfile ? 'Your Skills' : `${displayName}'s Skills`}</h3>
      
      {skills.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          {isOwnProfile ? 'No skills added yet.' : `${displayName} hasn't added any skills yet.`}
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {skills.map((skill) => {
            const hasEndorsed = skill.endorsements.includes(session?.address || '')
            
            return (
              <div 
                key={skill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>{skill.name}</span>
                  {skill.endorsements.length > 0 && (
                    <span style={{ 
                      backgroundColor: '#3b82f6', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {skill.endorsements.length}
                    </span>
                  )}
                </div>
                
                {canEndorse && (
                  <button
                    onClick={() => endorseSkill(skill.name)}
                    disabled={endorsing === skill.name || hasEndorsed}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: hasEndorsed ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: hasEndorsed ? 'default' : 'pointer',
                      opacity: endorsing === skill.name ? 0.5 : 1
                    }}
                    title={hasEndorsed ? 'Already endorsed' : 'Endorse this skill'}
                  >
                    {endorsing === skill.name ? '...' : hasEndorsed ? '✓ Endorsed' : '👍 Endorse'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {skills.length > 0 && canEndorse && (
        <p style={{ 
          fontSize: '0.8rem', 
          color: '#666', 
          marginTop: '1rem',
          fontStyle: 'italic'
        }}>
          Click &quot;👍 Endorse&quot; to vouch for {displayName}&apos;s skills
        </p>
      )}
    </div>
  )
}
