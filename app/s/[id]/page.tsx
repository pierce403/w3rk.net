'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatButton from '../../../components/ChatButton'

interface Service {
  id: string
  title: string
  rate: string
  description: string
  user: { address: string; displayName: string }
  createdAt?: string
}

export default function ServicePage() {
  const params = useParams()
  const serviceNumber = parseInt(params.id as string)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchService()
  }, [serviceNumber])

  const fetchService = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const services = await response.json()
        // Get service by index (1-based numbering)
        const selectedService = services[serviceNumber - 1]
        setService(selectedService || null)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading Service...</h1>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="card">
        <h1>Service Not Found</h1>
        <p>Service #{serviceNumber} could not be found.</p>
        <a href="/s" className="btn">← Back to Services</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <a href="/s" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Services
          </a>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              Service #{serviceNumber}
            </div>
            <h1 style={{ margin: 0, marginBottom: '1rem' }}>{service.title}</h1>
            
            <div style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: '600', marginBottom: '0.5rem' }}>
              Rate: {service.rate} USDC
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem' }}>
              Provider: {service.user.displayName}
              {service.createdAt && ` • ${new Date(service.createdAt).toLocaleDateString()}`}
            </div>
          </div>
          
          <div style={{ marginLeft: '1rem' }}>
            <ChatButton
              serviceId={service.id}
              title={service.title}
              ownerAddress={service.user.address}
              type="service"
            />
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem' }}>Service Description</h3>
          <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {service.description}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Interested in this service?</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Click the chat button above to start a conversation with the service provider.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <ChatButton
            serviceId={service.id}
            title={service.title}
            ownerAddress={service.user.address}
            type="service"
          />
          <a href="/profile" className="btn secondary">
            Update Your Profile
          </a>
        </div>
      </div>
    </div>
  )
}
