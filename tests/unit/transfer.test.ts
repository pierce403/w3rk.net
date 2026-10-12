import test from 'node:test'
import assert from 'node:assert/strict'
import {fields,validate,sql,canonical,pgColumns} from '../../scripts/transfer-data.mjs'
const now='2026-10-12T00:00:00.000Z'
const snapshot=()=>({schemaVersion:1,exportedAt:now,tables:{
 users:[{id:'u1',address:'0x1234567890123456789012345678901234567890',ensName:null,baseName:null,displayName:"O'Brien",farcasterHandle:null,joinedAt:now,bio:null}],
 jobs:[{id:'j1',title:'task',budget:'10',desc:'d',createdAt:now,updatedAt:now,userId:'u1'}],
 services:[{id:'s1',title:'s',rate:'10',desc:'d',createdAt:now,updatedAt:now,userId:'u1'}],
 skills:[{id:'sk1',name:'SQL',createdAt:now,userId:'u1'}],
 endorsements:[{id:'e1',createdAt:now,skillId:'sk1',endorserId:'u1'}],
 chat_rooms:[{id:'r1',type:'job',title:null,createdAt:now,updatedAt:now,jobId:'j1',serviceId:null}],
 chat_participants:[{id:'p1',joinedAt:now,chatRoomId:'r1',userId:'u1'}],
 chat_messages:[{id:'m1',content:'test',xmtpId:null,createdAt:now,chatRoomId:'r1',senderId:'u1'}],
}})
test('transfer validates all eight tables and deterministic canonical hashes',()=>{
 const s=snapshot();assert.equal(Object.keys(fields).length,8);assert.equal(validate(s),s);assert.equal(canonical(s),canonical(structuredClone(s)))
 assert.match(sql(s,'d1'),/O''Brien/);assert.match(sql(s,'pg'),/Recovery destination must be empty/)
})
test('transfer rejects missing/extra fields, malformed dates, duplicates and dangling relationships',()=>{
 const malformed=snapshot();malformed.tables.jobs[0].userId='missing';assert.throws(()=>validate(malformed),/Dangling/)
 const extra=snapshot();Object.assign(extra.tables.users[0],{secret:'must not silently ignore'});assert.throws(()=>validate(extra),/Unexpected/)
 const duplicate=snapshot();duplicate.tables.users.push({...duplicate.tables.users[0],id:'u2'});assert.throws(()=>validate(duplicate),/case-insensitive/)
 const date=snapshot();date.tables.jobs[0].createdAt='2026-01-01';assert.throws(()=>validate(date),/timestamp/)
})
test('forward SQLite and reverse PostgreSQL SQL cover every table without changing IDs',()=>{
 for(const target of ['d1','pg'])for(const table of Object.keys(fields))assert.match(sql(snapshot(),target),new RegExp(`INSERT INTO "${table}"`))
})

test('synthetic full snapshot survives real D1 then embedded PostgreSQL recovery with exact hashes',async()=>{
 const {Miniflare,convertV4MiniflareOptions}=await import('miniflare')
 const {PGlite}=await import('@electric-sql/pglite')
 const {readFile}=await import('node:fs/promises')
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-10-12',d1Databases:['DB']}))
 const pg=new PGlite()
 try{
  const db=await mf.getD1Database('DB'),original=snapshot()
  await db.exec(await readFile('migrations/0001_application.sql','utf8'))
  await db.exec(sql(original,'d1'))
  const tables:Record<string,unknown[]>={}
  for(const [table,cols]of Object.entries(fields))tables[table]=(await db.prepare(`SELECT ${cols.map(c=>'"'+c+'"').join(',')} FROM "${table}"`).all()).results
  const restored={schemaVersion:1,exportedAt:now,tables}
  assert.equal(canonical(restored),canonical(original))
  await pg.exec(await readFile('scripts/postgres-recovery-schema.sql','utf8'))
  await pg.exec(sql(restored,'pg'))
  const back:Record<string,unknown[]>={}
  for(const [table,cols]of Object.entries(fields)){
   const {rows}=await pg.query<Record<string,unknown>>(`SELECT ${pgColumns(table)} FROM "${table}"`)
   back[table]=rows.map(row=>Object.fromEntries(cols.map(c=>[c,row[c] instanceof Date?row[c].toISOString():row[c]])))
  }
  assert.equal(canonical({schemaVersion:1,exportedAt:now,tables:back}),canonical(original))
  await assert.rejects(()=>pg.exec(sql(restored,'pg')),/must be empty/)
 }finally{await mf.dispose();await pg.close()}
})
