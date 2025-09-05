import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { skills, Skill } from '../../../lib/data'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user = searchParams.get('user')
  const result = user ? skills.filter(s => s.user === user) : skills
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  if (!data.name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  let skill = skills.find(s => s.user === session.address && s.name === data.name)
  if (!skill) {
    skill = { user: session.address, name: data.name, endorsements: [] }
    skills.push(skill)
  }
  return NextResponse.json(skill, { status: 201 })
}
