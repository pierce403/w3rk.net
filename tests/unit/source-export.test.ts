import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, chmod, lstat, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { canonical, fields, pgColumns, sql } from '../../scripts/transfer-data.mjs'
import { sourceMapping, sourceTables, validateSourceSchema, mapSourceRows, exportMappedPg, writeMappedExport } from '../../scripts/source-export.mjs'

const at = '2026-10-12T00:00:00.000Z'
const rows = {
  users: [{ id: 'u1', address: '0xabcdef1234567890123456789012345678901234', ensName: null, baseName: null, displayName: 'Source user', farcasterHandle: null, joinedAt: at, bio: null }],
  jobs: [{ id: 'j1', title: 'Existing job', budget: '10', desc: "Keep quotes ' and Unicode café", createdAt: at, updatedAt: at, userId: 'u1' }],
  services: [{ id: 's1', title: 'Existing service', rate: '20', desc: 'Description', createdAt: at, updatedAt: at, userId: 'u1' }],
  skills: [{ id: 'sk1', name: 'SQL', createdAt: at, userId: 'u1' }],
  endorsements: [{ id: 'e1', createdAt: at, skillId: 'sk1', endorserId: 'u1' }],
}
const pg = new PGlite()
let schema: any
before(async () => {
  await pg.exec(await readFile('prisma/migrations/20250905230200_/migration.sql', 'utf8'))
  schema = {
    tables: (await pg.query("SELECT table_schema,table_name,table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows,
    columns: (await pg.query("SELECT table_schema,table_name,column_name,data_type,is_nullable,datetime_precision,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows,
  }
  const mapped = mapSourceRows(schema, rows, at)
  await pg.exec(sql(mapped.snapshot, 'pg-source'))
})
after(() => pg.close())

test('approved mapping accepts the actual original schema and explicitly initializes only missing chat tables', () => {
  const withMetadata = structuredClone(schema)
  withMetadata.tables.push({ table_schema: 'public', table_name: '_prisma_migrations', table_type: 'BASE TABLE' })
  const { snapshot, manifest } = mapSourceRows(withMetadata, rows, at)
  assert.equal(manifest.mapping, sourceMapping)
  assert.deepEqual(manifest.preserved, sourceTables)
  assert.deepEqual(manifest.sourceSchema.excludedMetadataTables, ['_prisma_migrations'])
  assert.deepEqual(manifest.counts, { users: 1, jobs: 1, services: 1, skills: 1, endorsements: 1, chat_rooms: 0, chat_participants: 0, chat_messages: 0 })
  for (const table of sourceTables) assert.deepEqual(snapshot.tables[table], rows[table as keyof typeof rows])
})

test('source mapping rejects any missing source table, additional application table or now-present chat table', () => {
  for (const table of sourceTables) {
    const changed = structuredClone(schema)
    changed.tables = changed.tables.filter((t: any) => t.table_name !== table)
    assert.throws(() => validateSourceSchema(changed), /source tables/)
  }
  for (const table of ['unreviewed_data', 'chat_rooms', 'chat_participants', 'chat_messages']) {
    const changed = structuredClone(schema)
    changed.tables.push({ table_schema: 'public', table_name: table, table_type: 'BASE TABLE' })
    assert.throws(() => validateSourceSchema(changed), /source tables/)
  }
})

test('source mapping rejects views, duplicate relations and unexpected schemas', () => {
  for (const delta of [{ table_type: 'VIEW' }, { table_schema: 'other' }]) {
    const changed = structuredClone(schema)
    Object.assign(changed.tables[0], delta)
    assert.throws(() => validateSourceSchema(changed), /source relation/)
  }
  const changed = structuredClone(schema)
  changed.tables.push(changed.tables[0])
  assert.throws(() => validateSourceSchema(changed), /Duplicate source table/)
})

test('source mapping refuses missing, extra or mismatched column definitions', () => {
  const missing = structuredClone(schema)
  missing.columns = missing.columns.filter((c: any) => !(c.table_name === 'jobs' && c.column_name === 'title'))
  assert.throws(() => validateSourceSchema(missing), /source columns/)
  const extra = structuredClone(schema)
  extra.columns.push({ ...extra.columns.find((c: any) => c.table_name === 'jobs'), column_name: 'unreviewed' })
  assert.throws(() => validateSourceSchema(extra), /source columns/)
  for (const delta of [{ data_type: 'timestamp with time zone' }, { datetime_precision: 6 }, { is_nullable: 'YES' }, { column_default: null }]) {
    const changed = structuredClone(schema)
    Object.assign(changed.columns.find((c: any) => c.table_name === 'users' && c.column_name === 'joinedAt'), delta)
    assert.throws(() => validateSourceSchema(changed), /source column definition/)
  }
})

test('mapped row data cannot silently omit tables, add columns, merge wallets or lose references', () => {
  const missing: any = structuredClone(rows)
  delete missing.skills
  assert.throws(() => mapSourceRows(schema, missing, at), /source row tables/)
  assert.throws(() => mapSourceRows(schema, { ...rows, chat_rooms: [] }, at), /source row tables/)
  const extra = structuredClone(rows)
  Object.assign(extra.users[0], { unreviewed: 'field' })
  assert.throws(() => mapSourceRows(schema, extra, at), /Unexpected fields/)
  const collision = structuredClone(rows)
  collision.users.push({ ...collision.users[0], id: 'u2', address: '0x' + collision.users[0].address.slice(2).toUpperCase() })
  assert.throws(() => mapSourceRows(schema, collision, at), /case-insensitive wallet/)
  const reference = structuredClone(rows)
  reference.jobs[0].userId = 'missing'
  assert.throws(() => mapSourceRows(schema, reference, at), /Dangling reference/)
})

test('mapped export uses one read-only snapshot of actual five-table PostgreSQL and exact UTC timestamps', async () => {
  const statements: string[] = []
  const client = { query: async (statement: string) => { statements.push(statement); return pg.query(statement) } }
  const exported = await exportMappedPg(client, at)
  assert.equal(statements[0], 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
  assert.equal(statements.at(-1), 'COMMIT')
  assert.ok(statements.every(s => /^(BEGIN|SET LOCAL|SELECT|COMMIT)/.test(s)))
  assert.equal(canonical(exported.snapshot), canonical(mapSourceRows(schema, rows, at).snapshot))
  assert.equal(exported.snapshot.tables.jobs[0].createdAt, at)
})

test('schema drift aborts read-only export before application selects or any file output', async () => {
  const statements: string[] = []
  const client = { query: async (statement: string) => {
    statements.push(statement)
    if (statement.includes('information_schema.tables')) return { rows: [...schema.tables, { table_schema: 'public', table_name: 'chat_rooms', table_type: 'BASE TABLE' }] }
    if (statement.includes('information_schema.columns')) return { rows: schema.columns }
    return { rows: [] }
  } }
  await assert.rejects(() => exportMappedPg(client, at), /source tables/)
  assert.equal(statements.at(-1), 'ROLLBACK')
  assert.equal(statements.some(s => /FROM public\./.test(s)), false)
})

test('mapped snapshot still reverses into the actual original five-table schema with exact data', async () => {
  const recovery = new PGlite()
  try {
    const mapped = mapSourceRows(schema, rows, at)
    await recovery.exec(await readFile('prisma/migrations/20250905230200_/migration.sql', 'utf8'))
    await recovery.exec(sql(mapped.snapshot, 'pg-source'))
    const restored: Record<string, unknown[]> = { chat_rooms: [], chat_participants: [], chat_messages: [] }
    for (const table of sourceTables) restored[table] = (await recovery.query(`SELECT ${pgColumns(table)} FROM "${table}" ORDER BY id`)).rows
    assert.equal(canonical({ schemaVersion: 1, exportedAt: at, tables: restored }), canonical(mapped.snapshot))
    await assert.rejects(() => recovery.exec(sql(mapped.snapshot, 'pg-source')), /must be empty/)
    assert.equal(Object.keys(fields).length, 8, 'The generic snapshot contract still requires all eight tables')
  } finally { await recovery.close() }
})

test('timestamped snapshot and manifest are private, match counts/digest, and never overwrite', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'w3rk-source-export-'))
  try {
    await chmod(dir, 0o700)
    const mapped = mapSourceRows(schema, rows, at)
    const result = await writeMappedExport(dir, mapped)
    assert.equal(result.output, '2026-10-12T00-00-00-000Z-source.json')
    assert.equal(result.manifest, '2026-10-12T00-00-00-000Z-manifest.json')
    for (const file of [result.output, result.manifest]) assert.equal((await lstat(join(dir, file))).mode & 0o777, 0o600)
    const saved = JSON.parse(await readFile(join(dir, result.manifest), 'utf8'))
    assert.equal(saved.sha256, result.sha256)
    assert.deepEqual(saved.counts, result.counts)
    await assert.rejects(() => writeMappedExport(dir, mapped), /EEXIST/)
    await chmod(dir, 0o755)
    await assert.rejects(() => writeMappedExport(dir, mapped), /mode0700/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
