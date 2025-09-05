import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { jobs, Job } from '../../../lib/data'

export async function GET() {
  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  if (!data.title || !data.budget || !data.desc) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const job: Job = {
    id: crypto.randomUUID(),
    title: data.title,
    budget: data.budget,
    desc: data.desc,
  }
  jobs.push(job)
  return NextResponse.json(job, { status: 201 })
}
