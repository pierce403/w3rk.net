import { lstat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { fields, validate, report, pgColumns } from './transfer-data.mjs'

export const sourceMapping = 'original-five-table-v1'
export const sourceTables = ['users', 'jobs', 'services', 'skills', 'endorsements']
export const absentChatTables = ['chat_rooms', 'chat_participants', 'chat_messages']
const nullableUserColumns = ['ensName', 'baseName', 'farcasterHandle', 'bio']
const exact = (actual, expected, label) => {
  if ([...actual].sort().join('\0') !== [...expected].sort().join('\0')) throw Error(`Unexpected ${label}`)
}

// This option applies only to the audited public schema. Prisma's own migration
// metadata may exist, but no additional application table or chat table may exist.
export function validateSourceSchema(schema) {
  if (!schema || !Array.isArray(schema.tables) || !Array.isArray(schema.columns)) throw Error('Invalid source schema')
  if (schema.tables.some(t => t.table_schema !== 'public' || t.table_type !== 'BASE TABLE')) throw Error('Unexpected source relation')
  const names = schema.tables.map(t => t.table_name)
  if (new Set(names).size !== names.length) throw Error('Duplicate source table')
  exact(names.filter(t => t !== '_prisma_migrations'), sourceTables, 'source tables for approved mapping')
  if (schema.columns.some(c => c.table_schema !== 'public' || !names.includes(c.table_name))) throw Error('Unexpected source column table')
  const columns = []
  for (const table of sourceTables) {
    const actual = schema.columns.filter(c => c.table_name === table)
    exact(actual.map(c => c.column_name), fields[table], `source columns in ${table}`)
    for (const name of fields[table]) {
      const column = actual.find(c => c.column_name === name)
      const timestamp = name.endsWith('At')
      const expected = {
        data_type: timestamp ? 'timestamp without time zone' : 'text',
        is_nullable: table === 'users' && nullableUserColumns.includes(name) ? 'YES' : 'NO',
        datetime_precision: timestamp ? 3 : null,
        column_default: timestamp && name !== 'updatedAt' ? 'CURRENT_TIMESTAMP' : null,
      }
      for (const [key, value] of Object.entries(expected)) {
        if (column[key] !== value) throw Error(`Unexpected source column definition ${table}.${name}`)
      }
      columns.push({ table_name: table, column_name: name, ...expected })
    }
  }
  return { schema: 'public', tables: [...sourceTables], columns, excludedMetadataTables: names.includes('_prisma_migrations') ? ['_prisma_migrations'] : [] }
}

export function mapSourceRows(schema, tables, exportedAt) {
  const sourceSchema = validateSourceSchema(schema)
  if (!tables || typeof tables !== 'object' || Array.isArray(tables)) throw Error('Invalid source rows')
  exact(Object.keys(tables), sourceTables, 'source row tables')
  const snapshot = validate({ schemaVersion: 1, exportedAt, tables: { ...tables, ...Object.fromEntries(absentChatTables.map(t => [t, []])) } })
  const manifest = {
    mapping: sourceMapping,
    exportedAt,
    transaction: 'REPEATABLE READ READ ONLY',
    preserved: [...sourceTables],
    initialized: Object.fromEntries(absentChatTables.map(t => [t, 'Explicitly approved source-absent table initialized empty'])),
    sourceSchema,
    sourceSchemaSha256: createHash('sha256').update(JSON.stringify(sourceSchema)).digest('hex'),
    ...report(snapshot),
  }
  return { snapshot, manifest }
}

// The supplied client is already connected. No DDL, DML or source mutation occurs.
export async function exportMappedPg(client, exportedAt = new Date().toISOString()) {
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    await client.query("SET LOCAL TIME ZONE 'UTC'")
    await client.query("SET LOCAL statement_timeout = '30s'")
    const tables = (await client.query("SELECT table_schema,table_name,table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows
    const columns = (await client.query("SELECT table_schema,table_name,column_name,data_type,is_nullable,datetime_precision,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows
    const schema = { tables, columns }
    validateSourceSchema(schema)
    const rows = {}
    for (const table of sourceTables) rows[table] = (await client.query(`SELECT ${pgColumns(table)} FROM public."${table}" ORDER BY id`)).rows
    const mapped = mapSourceRows(schema, rows, exportedAt)
    await client.query('COMMIT')
    return mapped
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }
}

export async function writeMappedExport(directory, { snapshot, manifest }) {
  const info = await lstat(directory)
  if (!info.isDirectory() || (info.mode & 0o777) !== 0o700) throw Error('Mapped export requires an existing private directory with mode0700')
  validate(snapshot)
  if (manifest.mapping !== sourceMapping || manifest.exportedAt !== snapshot.exportedAt || manifest.sha256 !== report(snapshot).sha256) throw Error('Mapped manifest does not match snapshot')
  const stamp = new Date(snapshot.exportedAt).toISOString().replace(/[:.]/g, '-')
  const output = `${stamp}-source.json`, manifestFile = `${stamp}-manifest.json`
  // Refuse overwrites. A filesystem failure may leave one private file; inspect
  // it and choose a fresh export rather than deleting evidence or retrying blindly.
  await writeFile(join(directory, output), JSON.stringify(snapshot) + '\n', { mode: 0o600, flag: 'wx' })
  await writeFile(join(directory, manifestFile), JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
  return { output, manifest: manifestFile, mapping: sourceMapping, ...report(snapshot) }
}
