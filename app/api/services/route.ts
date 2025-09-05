import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { services, Service } from '../../../lib/data'

export async function GET() {
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  if (!data.title || !data.rate || !data.desc) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const service: Service = {
    id: crypto.randomUUID(),
    title: data.title,
    rate: data.rate,
    desc: data.desc,
    user: session.address,
  }
  services.push(service)
  return NextResponse.json(service, { status: 201 })
}
