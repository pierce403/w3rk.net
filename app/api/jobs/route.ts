import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getAuthenticatedUser } from '../../../lib/apiAuth'

export async function GET(req: Request) {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        user: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform to match the old API format for compatibility
    const result = jobs.map(job => ({
      id: job.id,
      title: job.title,
      budget: job.budget,
      desc: job.description,
      // Additional data for enhanced features
      user: job.user.address,
      userDisplayName: job.user.displayName,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAddress = await getAuthenticatedUser(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await req.json()
    if (!data.title || !data.budget || !data.desc) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: userAddress }
    })
    
    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          address: userAddress,
          displayName: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
        }
      })
    }
    
    // Create new job
    const newJob = await prisma.job.create({
      data: {
        title: data.title,
        budget: data.budget,
        description: data.desc,
        userId: user.id
      },
      include: {
        user: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        }
      }
    })
    
    // Return in old API format for compatibility
    const result = {
      id: newJob.id,
      title: newJob.title,
      budget: newJob.budget,
      desc: newJob.description,
      user: newJob.user.address,
      userDisplayName: newJob.user.displayName,
      createdAt: newJob.createdAt
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}