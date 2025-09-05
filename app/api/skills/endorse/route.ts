import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { skills } from '../../../../lib/data'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  const skill = skills.find(s => s.user === data.user && s.name === data.name)
  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  }
  if (!skill.endorsements.includes(session.address)) {
    skill.endorsements.push(session.address)
  }
  return NextResponse.json(skill)
}
