import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const nonce = randomBytes(16).toString('base64')
  const res = NextResponse.json({ nonce })
  res.cookies.set('nonce', nonce, { httpOnly: true, sameSite: 'lax' })
  return res
}
