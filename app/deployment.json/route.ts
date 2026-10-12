export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    { project: 'w3rk.net', revision: process.env.W3RK_BUILD_REVISION },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
