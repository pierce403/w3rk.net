'use client'

import { useEffect, useState } from 'react'
import ChatButton from '../../components/ChatButton'

interface Job {
  id: string
  title: string
  budget: string
  description: string
  user: { address: string; displayName: string }
  createdAt?: string
}

export default function Jobs() {
  const [jobList, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const jobs = await response.json()
        setJobs(jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Available Jobs</h1>
        <p>Loading jobs...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Available Jobs</h1>
        <a href="/post" className="btn">
          Post a Job
        </a>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {jobList.map((job, index) => (
          <div key={job.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
                  <a href={`/j/${index + 1}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {job.title}
                  </a>
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  Budget: {job.budget} USDC
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>
                  Posted by: {job.user.displayName}
                </div>
                <p style={{ margin: 0 }}>{job.description}</p>
              </div>
              
              <div style={{ marginLeft: '1rem' }}>
                <ChatButton
                  jobId={job.id}
                  title={job.title}
                  ownerAddress={job.user.address}
                  type="job"
                />
              </div>
            </div>
            
            {job.createdAt && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#aaa', 
                marginTop: '1rem',
                borderTop: '1px solid #eee',
                paddingTop: '0.5rem'
              }}>
                Posted: {new Date(job.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {jobList.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No jobs available yet. Be the first to post one!
          </p>
        </div>
      )}
    </div>
  )
}
