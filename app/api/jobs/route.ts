import { NextResponse } from 'next/server'

export type Job = {
  id: string
  title: string
  budget: string
  desc: string
}

const jobs: Job[] = []

export async function GET() {
  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
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
