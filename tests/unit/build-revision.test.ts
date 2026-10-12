import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRevision } from '../../scripts/build-revision.mjs'
import { GET, dynamic } from '../../app/deployment.json/route'

test('native Git commit wins without consulting the local checkout', () => {
  const native = 'a'.repeat(40)
  assert.equal(buildRevision({ CF_COMMIT_SHA: native }, () => { throw new Error('Git must not be consulted') }), native)
})

test('local validation uses the exact local revision when native metadata is absent', () => {
  const local = 'b'.repeat(40)
  assert.equal(buildRevision({}, () => local), local)
})

test('invalid or empty native metadata fails without silently falling back', () => {
  for (const value of ['', 'main', 'a'.repeat(39), 'A'.repeat(40), 'a'.repeat(40) + '\n']) {
    assert.throws(() => buildRevision({ CF_COMMIT_SHA: value }, () => 'b'.repeat(40)), /Invalid build revision/)
  }
  assert.throws(() => buildRevision({}, () => 'unknown'), /Invalid build revision/)
})

test('public marker contains only project and build revision, no-store and no cookies', async () => {
  const previous = process.env.W3RK_BUILD_REVISION
  try {
    process.env.W3RK_BUILD_REVISION = 'c'.repeat(40)
    const response = GET()
    assert.equal(dynamic, 'force-dynamic')
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.has('set-cookie'), false)
    assert.deepEqual(await response.json(), { project: 'w3rk.net', revision: 'c'.repeat(40) })
  } finally {
    if (previous === undefined) delete process.env.W3RK_BUILD_REVISION
    else process.env.W3RK_BUILD_REVISION = previous
  }
})
