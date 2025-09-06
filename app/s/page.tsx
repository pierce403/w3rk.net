'use client'

import { useEffect, useState } from 'react'
import ChatButton from '../../components/ChatButton'

interface Service {
  id: string
  title: string
  rate: string
  desc: string
  user: string
  userDisplayName?: string
  createdAt?: string
}

export default function Services() {
  const [serviceList, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const services = await response.json()
        setServices(services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Available Services</h1>
        <p>Loading services...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Available Services</h1>
        <a href="/advertise" className="btn">
          Advertise Service
        </a>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {serviceList.map((service, index) => (
          <div key={service.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
                  <a href={`/s/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {service.title}
                  </a>
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  Rate: {service.rate} USDC
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>
                  Provider: {service.userDisplayName || `${service.user.slice(0, 6)}...${service.user.slice(-4)}`}
                </div>
                <p style={{ margin: 0 }}>{service.desc}</p>
              </div>
              
              <div style={{ marginLeft: '1rem' }}>
                <ChatButton
                  serviceId={service.id}
                  title={service.title}
                  ownerAddress={service.user}
                  type="service"
                />
              </div>
            </div>
            
            {service.createdAt && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#aaa', 
                marginTop: '1rem',
                borderTop: '1px solid #eee',
                paddingTop: '0.5rem'
              }}>
                Posted: {new Date(service.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {serviceList.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No services available yet. Be the first to advertise one!
          </p>
        </div>
      )}
    </div>
  )
}
