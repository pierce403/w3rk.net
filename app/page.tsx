'use client'

import { useEffect, useState } from 'react'
import BaseAuthButton from '../components/BaseAuthButton'

interface Job {
  id: string
  title: string
  budget: string
  description: string
  user: { displayName: string; address: string }
  createdAt: string
}

interface Service {
  id: string
  title: string
  rate: string
  description: string
  user: { displayName: string; address: string }
  createdAt: string
}

export default function Home() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [recentServices, setRecentServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
    try {
      const [jobsResponse, servicesResponse] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/services')
      ])

      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json()
        setRecentJobs(jobs.slice(0, 3)) // Get latest 3 jobs
      }

      if (servicesResponse.ok) {
        const services = await servicesResponse.json()
        setRecentServices(services.slice(0, 3)) // Get latest 3 services
      }
    } catch (error) {
      console.error('Error fetching recent posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Hero Section */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontWeight: '600' }}>
          w3rk<span style={{ opacity: 0.7 }}>.net</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', margin: '0 0 2rem 0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Decentralized work platform built on Base. Connect your wallet, find opportunities, and get paid onchain.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <a href="/j" className="btn secondary">
            Browse Jobs
          </a>
          <a href="/s" className="btn secondary">
            Find Services
          </a>
        </div>
        
        {/* Base App Login */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BaseAuthButton />
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {/* Recent Jobs */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>🔍 Latest Jobs</h3>
            <a href="/j" style={{ fontSize: '0.875rem', color: '#0ea5e9', textDecoration: 'none' }}>
              View all →
            </a>
          </div>
          
          {loading ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Loading jobs...</p>
          ) : recentJobs.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {recentJobs.map((job, index) => (
                <div key={job.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                    <a href={`/j/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {job.title}
                    </a>
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#0ea5e9', marginBottom: '0.5rem' }}>
                    {job.budget} USDC
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666', 
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    by <a href={`/u/${job.user.address}`} style={{ color: '#0ea5e9', textDecoration: 'none' }}>
                      {job.user.displayName}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No jobs posted yet. Be the first!</p>
          )}
        </div>

        {/* Recent Services */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>🛠️ Latest Services</h3>
            <a href="/s" style={{ fontSize: '0.875rem', color: '#10b981', textDecoration: 'none' }}>
              View all →
            </a>
          </div>
          
          {loading ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Loading services...</p>
          ) : recentServices.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {recentServices.map((service, index) => (
                <div key={service.id} style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                    <a href={`/s/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {service.title}
                    </a>
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#10b981', marginBottom: '0.5rem' }}>
                    {service.rate} USDC
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666',
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {service.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    by <a href={`/u/${service.user.address}`} style={{ color: '#10b981', textDecoration: 'none' }}>
                      {service.user.displayName}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No services posted yet. Be the first!</p>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>How w3rk.net Works</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <h3 style={{ color: '#0ea5e9', marginBottom: '0.5rem' }}>🔍 Find Work</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Browse available jobs and services. Connect directly with job posters through built-in chat.
            </p>
          </div>
          <div>
            <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>💼 Post Opportunities</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Post jobs you need done or advertise services you provide. Set your rates and connect with talent.
            </p>
          </div>
          <div>
            <h3 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>💬 Communicate</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Built-in chat system lets you discuss project details, negotiate terms, and coordinate work.
            </p>
          </div>
          <div>
            <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⭐ Build Reputation</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Showcase your skills on your profile and earn endorsements from collaborators.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🌐 Web3 Native</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#666' }}>
            <li>Connect with any Ethereum wallet</li>
            <li>Built on Base for fast, cheap transactions</li>
            <li>ENS and Base name integration</li>
            <li>Decentralized identity and reputation</li>
          </ul>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>💼 For Everyone</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#666' }}>
            <li><strong>Freelancers:</strong> Find remote work opportunities</li>
            <li><strong>Businesses:</strong> Hire specialized talent</li>
            <li><strong>Service Providers:</strong> Advertise your offerings</li>
            <li><strong>Job Seekers:</strong> Discover new opportunities</li>
          </ul>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🚀 Getting Started</h3>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#666' }}>
            <li>Connect your wallet (any Ethereum wallet)</li>
            <li>Set up your profile and add your skills</li>
            <li>Browse jobs or post your own opportunities</li>
            <li>Use chat to communicate and coordinate</li>
          </ol>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card" style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <h3 style={{ marginBottom: '1rem' }}>Ready to Get Started?</h3>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Connect your wallet and join the future of work on Base.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/post" className="btn">
            Post a Job
          </a>
          <a href="/advertise" className="btn secondary">
            Advertise Service
          </a>
          <a href="/profile" className="btn secondary">
            Set Up Profile
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Built for the Future</h3>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>⚡</div>
            <div style={{ fontWeight: '500' }}>Fast Transactions</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Built on Base L2</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>🔒</div>
            <div style={{ fontWeight: '500' }}>Secure & Trustless</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Blockchain verified</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>🌍</div>
            <div style={{ fontWeight: '500' }}>Global Access</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Anyone, anywhere</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>💬</div>
            <div style={{ fontWeight: '500' }}>Direct Communication</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Built-in chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}