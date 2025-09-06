import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getAuthenticatedUser } from '../../../lib/apiAuth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userParam = searchParams.get('user')
    
    const where = userParam ? {
      user: {
        address: userParam
      }
    } : {}
    
    const skills = await prisma.skill.findMany({
      where,
      include: {
        user: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        },
        endorsements: {
          include: {
            endorser: {
              select: {
                address: true,
                displayName: true,
                ensName: true,
                baseName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform to match the old API format
    const result = skills.map(skill => ({
      user: skill.user.address,
      name: skill.name,
      endorsements: skill.endorsements.map(e => e.endorser.address),
      // Additional data for enhanced features
      id: skill.id,
      userDisplayName: skill.user.displayName,
      endorsementDetails: skill.endorsements.map(e => ({
        address: e.endorser.address,
        displayName: e.endorser.displayName,
        endorsedAt: e.createdAt
      }))
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching skills:', error)
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
    if (!data.name) {
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
    
    // Check if skill already exists for this user
    const existingSkill = await prisma.skill.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: data.name
        }
      },
      include: {
        user: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        },
        endorsements: {
          include: {
            endorser: {
              select: {
                address: true,
                displayName: true
              }
            }
          }
        }
      }
    })
    
    if (existingSkill) {
      // Return existing skill in old API format
      const result = {
        user: existingSkill.user.address,
        name: existingSkill.name,
        endorsements: existingSkill.endorsements.map(e => e.endorser.address),
        id: existingSkill.id,
        userDisplayName: existingSkill.user.displayName
      }
      return NextResponse.json(result, { status: 200 })
    }
    
    // Create new skill
    const newSkill = await prisma.skill.create({
      data: {
        name: data.name,
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
        },
        endorsements: true
      }
    })
    
    // Return in old API format
    const result = {
      user: newSkill.user.address,
      name: newSkill.name,
      endorsements: [],
      id: newSkill.id,
      userDisplayName: newSkill.user.displayName
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}