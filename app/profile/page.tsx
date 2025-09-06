'use client'
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth'
import { useENSName } from '../../hooks/useENSName'
import SkillsManager from '../../components/SkillsManager'

export default function Profile() {
  const { data: session, status } = useUnifiedAuth()
  const { displayName, isLoading } = useENSName(session?.address)

  if (status === 'loading' || isLoading) {
    return (
      <div className="card">
        <p>Loading your profile...</p>
      </div>
    )
  }

  if (!session?.address) {
    return (
      <div className="card">
        <h2>Profile</h2>
        <p>Please connect your wallet to access your profile.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <h2>Your Profile</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Display Name:</strong> {displayName}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Wallet Address: {session.address}
          </div>
        </div>

        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
            <strong>💡 Tip:</strong> Add your skills below so others can discover your expertise and endorse you!
          </p>
        </div>
        
        <SkillsManager />
      </div>
    </div>
  )
}