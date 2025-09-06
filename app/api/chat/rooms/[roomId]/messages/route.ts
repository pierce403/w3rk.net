import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../../../lib/apiAuth'

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const userAddress = await getAuthenticatedUser(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    // Find user
    const user = await prisma.user.findUnique({
      where: { address: userAddress }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a participant in this chat room
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: user.id
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages for this chat room
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId
      },
      include: {
        sender: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const userAddress = await getAuthenticatedUser(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params
    const data = await req.json()
    const { content, xmtpId } = data

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { address: userAddress }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a participant in this chat room
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: user.id
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        xmtpId: xmtpId || null,
        chatRoomId: roomId,
        senderId: user.id
      },
      include: {
        sender: {
          select: {
            address: true,
            displayName: true,
            ensName: true,
            baseName: true
          }
        }
      }
    })

    // Update the chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
