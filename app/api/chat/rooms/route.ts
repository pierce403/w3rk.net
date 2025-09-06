import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/apiAuth'

export async function GET(req: NextRequest) {
  try {
    const userAddress = await getAuthenticatedUser(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { address: userAddress }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all chat rooms where the user is a participant
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                address: true,
                displayName: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                address: true,
                displayName: true
              }
            }
          }
        },
        participants: {
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
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                address: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(chatRooms)
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
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
    const { type, jobId, serviceId, title, participantAddresses } = data

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: userAddress }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: userAddress,
          displayName: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
        }
      })
    }

    // Create chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        type,
        title,
        jobId: jobId || null,
        serviceId: serviceId || null
      }
    })

    // Add creator as participant
    await prisma.chatParticipant.create({
      data: {
        chatRoomId: chatRoom.id,
        userId: user.id
      }
    })

    // Add other participants if provided
    if (participantAddresses && participantAddresses.length > 0) {
      for (const address of participantAddresses) {
        let participant = await prisma.user.findUnique({
          where: { address }
        })

        if (!participant) {
          participant = await prisma.user.create({
            data: {
              address,
              displayName: `${address.slice(0, 6)}...${address.slice(-4)}`
            }
          })
        }

        await prisma.chatParticipant.create({
          data: {
            chatRoomId: chatRoom.id,
            userId: participant.id
          }
        })
      }
    }

    // Return the created chat room with participants
    const createdRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoom.id },
      include: {
        participants: {
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
        },
        job: {
          select: {
            id: true,
            title: true
          }
        },
        service: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(createdRoom, { status: 201 })
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
