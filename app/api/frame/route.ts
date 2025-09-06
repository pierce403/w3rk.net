import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Handle Farcaster frame GET requests
  return NextResponse.json({
    message: 'w3rk.net Farcaster Frame endpoint',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  try {
    // Handle Farcaster frame POST requests
    const body = await req.json()
    
    // Log frame interactions for debugging
    console.log('Farcaster frame interaction:', body)
    
    // Return frame response that redirects to the main app
    return NextResponse.json({
      type: 'frame',
      data: {
        image: 'https://w3rk.net/icon-512.png',
        buttons: [
          {
            title: 'Launch w3rk.net',
            action: 'launch_frame',
            target: 'https://w3rk.net'
          }
        ]
      }
    })
  } catch (error) {
    console.error('Frame POST error:', error)
    return NextResponse.json(
      { error: 'Frame processing failed' },
      { status: 500 }
    )
  }
}
