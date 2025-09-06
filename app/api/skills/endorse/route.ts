import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    const endorserAddress = await getAuthenticatedUser(req)
    if (!endorserAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await req.json()
    if (!data.user || !data.skill) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    
    // Find or create endorser user
    let endorser = await prisma.user.findUnique({
      where: { address: endorserAddress }
    })
    
    if (!endorser) {
      endorser = await prisma.user.create({
        data: {
          address: endorserAddress,
          displayName: `${endorserAddress.slice(0, 6)}...${endorserAddress.slice(-4)}`
        }
      })
    }
    
    // Find the skill to endorse
    const targetUser = await prisma.user.findUnique({
      where: { address: data.user }
    })
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const skill = await prisma.skill.findUnique({
      where: {
        userId_name: {
          userId: targetUser.id,
          name: data.skill
        }
      }
    })
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    
    // Check if endorsement already exists
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        skillId_endorserId: {
          skillId: skill.id,
          endorserId: endorser.id
        }
      }
    })
    
    if (existingEndorsement) {
      return NextResponse.json({ error: 'Already endorsed' }, { status: 400 })
    }
    
    // Create the endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        skillId: skill.id,
        endorserId: endorser.id
      },
      include: {
        endorser: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        },
        skill: {
          include: {
            user: {
              select: {
                address: true,
                displayName: true
              }
            }
          }
        }
      }
    })
    
    // Return success response
    const result = {
      success: true,
      endorsement: {
        id: endorsement.id,
        endorser: endorsement.endorser.address,
        endorserDisplayName: endorsement.endorser.displayName,
        skill: endorsement.skill.name,
        skillOwner: endorsement.skill.user.address,
        createdAt: endorsement.createdAt
      }
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating endorsement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}