import { isReadOnly } from './db'
import { getAuthenticatedUser } from './apiAuth'
import { HttpError } from './repository'
export const json = (data: unknown, status = 200) => Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}})
export async function handle(action: () => Promise<Response>) {
  try { return await action() } catch (e) {
    if(e instanceof HttpError) return json({error:e.message},e.status)
    if(e instanceof SyntaxError) return json({error:'Invalid JSON'},400)
    console.error('api_request_failed')
    return json({error:'Internal server error'},500)
  }
}
export function writable() { if(isReadOnly()) throw new HttpError(503,'Temporarily read-only for maintenance') }
export async function authenticate(req: Request, write = false) {
  if(write) writable()
  const address=await getAuthenticatedUser(req)
  if(!address) throw new HttpError(401,'Unauthorized')
  if(write && req.headers.get('origin') !== new URL(req.url).origin) throw new HttpError(403,'Invalid origin')
  return address
}
export async function body(req:Request) {
  if(!req.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Expected JSON')
  const text=await req.text()
  if(text.length>65536) throw new HttpError(413,'Request too large')
  const data: unknown=JSON.parse(text)
  if(!data || typeof data!=='object' || Array.isArray(data)) throw new HttpError(400,'Invalid request')
  return data as Record<string,unknown>
}
export function text(value:unknown,name:string,max=300):string {
  if(typeof value!=='string'||!value.trim()||value.length>max) throw new HttpError(400,`Invalid ${name}`)
  return value.trim()
}
export function address(value:unknown):string {
  if(typeof value!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new HttpError(400,'Invalid address')
  return value
}
