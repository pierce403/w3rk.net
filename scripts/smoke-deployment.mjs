import assert from 'node:assert/strict'
import { buildRevision } from './build-revision.mjs'

const base = new URL(process.env.TEST_ORIGIN ?? 'http://localhost:5193')
const revision = process.env.EXPECTED_BUILD_REVISION ?? buildRevision()
assert.match(revision, /^[a-f0-9]{40}$/)
assert.ok(base.protocol === 'https:' || (base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
assert.equal(base.username, ''); assert.equal(base.password, '')
const response = await fetch(new URL('/deployment.json', base), { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
assert.equal(response.status, 200, 'deployment marker status')
assert.match(response.headers.get('content-type') ?? '', /^application\/json(?:;|$)/i)
assert.match(response.headers.get('cache-control') ?? '', /(?:^|,)\s*no-store(?:,|$)/i)
assert.equal(response.headers.has('set-cookie'), false, 'marker must not set a session cookie')
assert.deepEqual(await response.json(), { project: 'w3rk.net', revision })
console.log(`PASS: no-store deployment marker matches ${revision}`)
