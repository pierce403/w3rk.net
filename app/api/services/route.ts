import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getAuthenticatedUser } from '../../../lib/apiAuth'

export async function GET(req: Request) {
  try {
    const services = await prisma.service.findMany({
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
    const result = services.map(service => ({
      id: service.id,
      title: service.title,
      rate: service.rate,
      desc: service.description,
      user: service.user.address,
      // Additional data for enhanced features
      userDisplayName: service.user.displayName,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching services:', error)
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
    if (!data.title || !data.rate || !data.desc) {
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
    
    // Create new service
    const newService = await prisma.service.create({
      data: {
        title: data.title,
        rate: data.rate,
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
      id: newService.id,
      title: newService.title,
      rate: newService.rate,
      desc: newService.description,
      user: newService.user.address,
      userDisplayName: newService.user.displayName,
      createdAt: newService.createdAt
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}