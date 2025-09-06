import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getAuthenticatedUser } from '../../../lib/apiAuth'
import { getDisplayName } from '../../../lib/nameResolver'

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
    
    // Transform with ENS name resolution
    const result = await Promise.all(services.map(async service => {
      const displayName = await getDisplayName(service.user.address)
      return {
        id: service.id,
        title: service.title,
        rate: service.rate,
        description: service.description,
        user: {
          address: service.user.address,
          displayName: displayName
        },
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }
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
    
    // Return with ENS name resolution
    const displayName = await getDisplayName(newService.user.address)
    const result = {
      id: newService.id,
      title: newService.title,
      rate: newService.rate,
      description: newService.description,
      user: {
        address: newService.user.address,
        displayName: displayName
      },
      createdAt: newService.createdAt
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}