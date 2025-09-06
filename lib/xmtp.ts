// XMTP V3 client utilities for decentralized messaging integration
// Hybrid approach: Database for persistence/UI + XMTP for cross-app interoperability

import { Client } from '@xmtp/browser-sdk'
import type { Signer, Identifier, IdentifierKind } from '@xmtp/browser-sdk'

let xmtpClient: Client | null = null

/**
 * Initialize XMTP v3 client with proper wallet signer
 */
export async function initializeXMTP(signer: Signer): Promise<Client | null> {
  try {
    console.log('🔄 Initializing XMTP v3 client...')
    
    // Create XMTP v3 client with proper signer
    xmtpClient = await Client.create(signer, {
      env: 'production', // Use production XMTP network for cross-app compatibility
    })
    
    console.log('✅ XMTP client initialized successfully')
    console.log('🌐 Ready for cross-app messaging interoperability')
    return xmtpClient
  } catch (error) {
    console.error('❌ XMTP initialization failed:', error)
    console.warn('📦 App will continue with database-only messaging')
    // Don't throw error - app should work without XMTP
    return null
  }
}

/**
 * Get current XMTP client instance
 */
export function getXMTPClient(): Client | null {
  return xmtpClient
}

/**
 * Create or get XMTP conversation for 1:1 chat
 */
export async function createXMTPConversation(participantAddress: string): Promise<any> {
  if (!xmtpClient) {
    console.log('🔄 XMTP client not yet initialized - skipping conversation creation')
    return null
  }

  try {
    console.log('🔍 Creating XMTP conversation with:', participantAddress)
    
    // Create proper identifier for the participant
    const participantIdentifier: Identifier = {
      identifier: participantAddress,
      identifierKind: "Ethereum",
    }
    
    // Check if we can message this address
    const canMessage = await xmtpClient.canMessage([participantIdentifier])
    if (!canMessage.get(participantAddress)) {
      console.log('❌ Cannot message this address via XMTP')
      return null
    }
    
    // Create or get existing conversation (XMTP v3 uses groups for all conversations)
    const conversation = await xmtpClient.conversations.newGroup([participantAddress])
    console.log('✅ XMTP conversation ready:', conversation.id)
    return conversation
  } catch (error) {
    console.error('❌ Failed to create XMTP conversation:', error)
    return null
  }
}

/**
 * Disconnect XMTP client and cleanup
 */
export function disconnectXMTP(): void {
  xmtpClient = null
  console.log('XMTP client disconnected')
}

/**
 * Send message via XMTP to specific conversation
 */
export async function sendXMTPMessage(
  participantAddress: string, 
  content: string
): Promise<{ success: boolean; xmtpId?: string; error?: string }> {
  if (!xmtpClient) {
    return { success: false, error: 'XMTP client not initialized' }
  }

  try {
    // Get or create conversation
    const conversation = await createXMTPConversation(participantAddress)
    if (!conversation) {
      return { success: false, error: 'Could not create XMTP conversation' }
    }

    // Send message
    const sentMessage = await conversation.send(content)
    console.log('✅ Message sent via XMTP:', sentMessage.id)
    
    return { 
      success: true, 
      xmtpId: sentMessage.id 
    }
  } catch (error) {
    console.error('❌ Failed to send XMTP message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Listen for new messages from XMTP conversation
 */
export async function listenForXMTPMessages(
  participantAddress: string,
  onMessage: (message: any) => void
): Promise<void> {
  if (!xmtpClient) {
    console.warn('XMTP client not initialized')
    return
  }

  try {
    const conversation = await createXMTPConversation(participantAddress)
    if (!conversation) {
      console.warn('No XMTP conversation available for listening')
      return
    }

    console.log('👂 Listening for XMTP messages from:', participantAddress)

    // Stream new messages
    const stream = conversation.streamMessages()
    for await (const message of stream) {
      console.log('📨 New XMTP message received:', message.id)
      onMessage({
        id: message.id,
        content: message.content,
        senderAddress: message.senderAddress,
        sentAt: message.sentAt,
        xmtpId: message.id
      })
    }
  } catch (error) {
    console.error('❌ Error listening for XMTP messages:', error)
  }
}

/**
 * Get message history from XMTP conversation
 */
export async function getXMTPMessageHistory(participantAddress: string): Promise<any[]> {
  if (!xmtpClient) {
    return []
  }

  try {
    const conversation = await createXMTPConversation(participantAddress)
    if (!conversation) {
      return []
    }

    console.log('📜 Loading XMTP message history from:', participantAddress)
    
    // Get message history
    const messages = await conversation.messages()
    console.log(`✅ Loaded ${messages.length} XMTP messages`)
    
    return messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      senderAddress: message.senderAddress,
      sentAt: message.sentAt,
      xmtpId: message.id
    }))
  } catch (error) {
    console.error('❌ Error fetching XMTP message history:', error)
    return []
  }
}