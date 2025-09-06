'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatButton from '../../../components/ChatButton'

interface Job {
  id: string
  title: string
  budget: string
  desc: string
  user: string
  userDisplayName?: string
  createdAt?: string
}

export default function JobPage() {
  const params = useParams()
  const jobNumber = parseInt(params.id as string)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJob()
  }, [jobNumber])

  const fetchJob = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const jobs = await response.json()
        // Get job by index (1-based numbering)
        const selectedJob = jobs[jobNumber - 1]
        setJob(selectedJob || null)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading Job...</h1>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="card">
        <h1>Job Not Found</h1>
        <p>Job #{jobNumber} could not be found.</p>
        <a href="/j" className="btn">← Back to Jobs</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <a href="/j" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Jobs
          </a>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              Job #{jobNumber}
            </div>
            <h1 style={{ margin: 0, marginBottom: '1rem' }}>{job.title}</h1>
            
            <div style={{ fontSize: '1.1rem', color: '#0ea5e9', fontWeight: '600', marginBottom: '0.5rem' }}>
              Budget: {job.budget} USDC
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem' }}>
              Posted by: {job.userDisplayName || `${job.user.slice(0, 6)}...${job.user.slice(-4)}`}
              {job.createdAt && ` • ${new Date(job.createdAt).toLocaleDateString()}`}
            </div>
          </div>
          
          <div style={{ marginLeft: '1rem' }}>
            <ChatButton
              jobId={job.id}
              title={job.title}
              ownerAddress={job.user}
              type="job"
            />
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem' }}>Job Description</h3>
          <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {job.desc}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Interested in this job?</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Click the chat button above to start a conversation with the job poster.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <ChatButton
            jobId={job.id}
            title={job.title}
            ownerAddress={job.user}
            type="job"
          />
          <a href="/profile" className="btn secondary">
            Update Your Profile
          </a>
        </div>
      </div>
    </div>
  )
}
