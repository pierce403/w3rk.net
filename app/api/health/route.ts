import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, service: 'w3rk.net', time: new Date().toISOString() })
}
