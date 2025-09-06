'use client'
import { useState, useEffect } from 'react'
import { useUnifiedAuth } from '../hooks/useUnifiedAuth'

interface Skill {
  id: string
  name: string
  endorsements: string[]
  endorsementDetails?: Array<{
    address: string
    displayName: string
    endorsedAt: string
  }>
}

export default function SkillsManager() {
  const { data: session } = useUnifiedAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (session?.address) {
      fetchUserSkills()
    }
  }, [session])

  const fetchUserSkills = async () => {
    try {
      const response = await fetch(`/api/skills?user=${session?.address}`)
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

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkill.trim() || adding) return

    setAdding(true)
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSkill.trim() })
      })

      if (response.ok) {
        const skill = await response.json()
        setSkills(prev => [...prev, skill])
        setNewSkill('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add skill')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      alert('Failed to add skill. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div>Loading your skills...</div>
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Your Skills</h3>
      
      <form onSubmit={addSkill} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a new skill..."
            disabled={adding}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={!newSkill.trim() || adding} className="btn small">
            {adding ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      </form>

      {skills.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No skills added yet. Add your first skill above!
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {skills.map((skill) => (
            <div 
              key={skill.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '1.5rem',
                fontSize: '0.875rem'
              }}
            >
              <span>{skill.name}</span>
              {skill.endorsements.length > 0 && (
                <span style={{ 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '1.5rem', 
                  height: '1.5rem', 
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
          ))}
        </div>
      )}
    </div>
  )
}
